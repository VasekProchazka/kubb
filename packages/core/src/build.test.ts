import { build } from './build.ts'
import { createPlugin } from './plugin.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { Config, Plugin } from './types.ts'

describe('build', () => {
  const pluginMocks = {
    buildStart: vi.fn(),
    buildEnd: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  const file: KubbFile.File = {
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [{ value: "export const hello = 'world';" }],
  }
  const plugin = createPlugin(() => {
    return {
      name: 'plugin',
      options: undefined as any,
      context: undefined as never,
      key: ['plugin'],
      async buildStart(...params) {
        pluginMocks.buildStart(...params)

        await this.addFile(file)
      },
      buildEnd(...params) {
        pluginMocks.buildEnd(...params)
      },
    }
  })

  const config = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [plugin({})] as Plugin[],
  } satisfies Config

  afterEach(() => {
    Object.keys(pluginMocks).forEach((key) => {
      const mock = pluginMocks[key as keyof typeof pluginMocks]

      mock.mockClear()
    })
  })

  test('if build can run and return created files and the pluginManager', async () => {
    const { files, pluginManager } = await build({
      config,
    })

    expect(files).toBeDefined()
    expect(pluginManager).toBeDefined()
    expect(files.length).toBe(2)
  })

  test('if build with one plugin is running the different hooks in the correct order', async () => {
    const { files } = await build({
      config,
    })

    expect(files.map((file) => ({ ...file, path: undefined }))).toMatchInlineSnapshot(`
      [
        {
          "baseName": "world.json",
          "exports": [],
          "extname": ".json",
          "id": "c63fd2bea10086b4ce23e49922eaa45e1f37da03",
          "imports": [],
          "meta": {},
          "name": "world",
          "path": undefined,
          "sources": [
            {
              "value": "export const hello = 'world';",
            },
          ],
        },
        {
          "baseName": "index.ts",
          "exports": [],
          "extname": ".ts",
          "id": "1e619bfec508939eecbf072c8991974f654f3e5f",
          "imports": [],
          "meta": {},
          "name": "index",
          "path": undefined,
          "sources": [],
        },
      ]
    `)

    expect(pluginMocks.buildStart).toHaveBeenCalledTimes(1)
    expect(pluginMocks.buildEnd).toHaveBeenCalledTimes(1)
  })
})
