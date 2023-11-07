import path from 'node:path'

import { createPlugin, FileManager, PackageManager, PluginManager } from '@kubb/core'
import { read, renderTemplate } from '@kubb/core/utils'
import { pluginName as swaggerPluginName } from '@kubb/swagger'
import { getGroupedByTagFiles } from '@kubb/swagger/utils'

import { camelCase, camelCaseTransformMerge } from 'change-case'

import { OperationGenerator } from './OperationGenerator.tsx'

import type { KubbFile, KubbPlugin } from '@kubb/core'
import type { PluginOptions as SwaggerPluginOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

export const pluginName = 'swagger-client' satisfies PluginOptions['name']
export const pluginKey: PluginOptions['key'] = ['controller', pluginName] satisfies PluginOptions['key']

export const definePlugin = createPlugin<PluginOptions>((options) => {
  const {
    output = 'clients',
    groupBy,
    skipBy = [],
    overrideBy = [],
    transformers = {},
    client,
    clientImportPath,
    dataReturnType = 'data',
    pathParamsType = 'inline',
  } = options

  const template = groupBy?.output ? groupBy.output : `${output}/{{tag}}Controller`
  let pluginsOptions: [KubbPlugin<SwaggerPluginOptions>]

  return {
    name: pluginName,
    options: {
      dataReturnType,
      client,
      clientImportPath,
      pathParamsType,
    },
    kind: 'controller',
    validate(plugins) {
      pluginsOptions = PluginManager.getDependedPlugins<SwaggerPluginOptions>(plugins, [swaggerPluginName])

      return true
    },
    resolvePath(baseName, directory, options) {
      const root = path.resolve(this.config.root, this.config.output.path)
      const mode = FileManager.getMode(path.resolve(root, output))

      if (mode === 'file') {
        /**
         * when output is a file then we will always append to the same file(output file), see fileManager.addOrAppend
         * Other plugins then need to call addOrAppend instead of just add from the fileManager class
         */
        return path.resolve(root, output)
      }

      if (options?.tag && groupBy?.type === 'tag') {
        const tag = camelCase(options.tag, { delimiter: '', transform: camelCaseTransformMerge })

        return path.resolve(root, renderTemplate(template, { tag }), baseName)
      }

      return path.resolve(root, output, baseName)
    },
    resolveName(name) {
      const resolvedName = camelCase(name, { delimiter: '', stripRegexp: /[^A-Z0-9$]/gi, transform: camelCaseTransformMerge })

      return transformers?.name?.(resolvedName) || resolvedName
    },
    async writeFile(source, writePath) {
      if (!writePath.endsWith('.ts') || !source) {
        return
      }

      return this.fileManager.write(source, writePath)
    },
    async buildStart() {
      const [swaggerPlugin] = pluginsOptions

      const oas = await swaggerPlugin.api.getOas()

      const operationGenerator = new OperationGenerator(
        this.plugin.options,
        {
          oas,
          pluginManager: this.pluginManager,
          plugin: this.plugin,
          contentType: swaggerPlugin.api.contentType,
          skipBy,
          overrideBy,
        },
      )

      const files = await operationGenerator.build()

      await this.addFile(...files)
    },
    async buildEnd() {
      if (this.config.output.write === false) {
        return
      }
      const [swaggerPlugin] = pluginsOptions
      const root = path.resolve(this.config.root, this.config.output.path)

      if (groupBy?.type === 'tag') {
        const rootFiles = getGroupedByTagFiles({
          logger: this.logger,
          files: this.fileManager.files,
          plugin: this.plugin,
          template,
          exportAs: groupBy.exportAs || '{{tag}}Service',
          root,
          output,
          resolveName: this.pluginManager.resolveName,
        })

        await this.addFile(...rootFiles)
      }

      // Copy `client.ts` file only when the 'client' option is provided.
      if (client) {
        const packageManager = new PackageManager(process.cwd())

        const clientPath = path.resolve(root, 'client.ts')
        const originalClientPath: KubbFile.OptionalPath = options.client
          ? path.resolve(this.config.root, options.client)
          : packageManager.getLocation('@kubb/swagger-client/ts-client')

        if (!originalClientPath) {
          throw new Error(
            `Cannot find the 'client.ts' file, or 'client' is not set in the options or '@kubb/swagger-client' is not included in your dependencies`,
          )
        }

        const baseURL = await swaggerPlugin.api.getBaseURL()

        await this.addFile({
          baseName: 'client.ts',
          path: clientPath,
          source: await read(originalClientPath),
          env: {
            AXIOS_BASE: baseURL,
            AXIOS_HEADERS: JSON.stringify({}),
          },
        })
      }

      await this.fileManager.addIndexes({ root, extName: '.ts', meta: { pluginKey: this.plugin.key } })
    },
  }
})
