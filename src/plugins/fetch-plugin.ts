import * as esbuild from 'esbuild-wasm';
import localForage from "localforage";
import axios from "axios";

const fileCache = localForage.createInstance({
  name: 'filecache'
});

export const fetchPlugin = (input: string) => {
    return {
        name: "fetch-plugin",
        setup(build: esbuild.PluginBuild) {

            build.onLoad({ filter: /(^index\.js$)/ }, () => {
                return {
                        loader: 'jsx',
                        contents: input,
                    };
            });

            build.onLoad({ filter: /.*/ }, async (args: any) => {
                const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);
                if (cachedResult) {
                    return cachedResult;
                }
            });

            build.onLoad({ filter: /.css$/ }, async (args: any) => {
                const { data, request } = await axios.get(args.path);
                const escaped = data
                    .replace(/\n/g, '') // escape new lines
                    .replace(/"/g, '\\"') // escape double quotes
                    .replace(/'/g, "\\'"); // escape single quotes
                const contents =
                    ` 
                        const style = document.createElement('style');
                        style.innerText = '${escaped}';
                        document.head.appendChild(style);
                    `;
                
                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents,
                    resolveDir: new URL('./', request.responseURL).pathname
                };

                // store in cache
                await fileCache.setItem(args.path, result);

                return result;
            });

            build.onLoad({ filter: /.*/ }, async (args: any) => {
                const { data, request } = await axios.get(args.path);
                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname
                };

                // store in cache
                await fileCache.setItem(args.path, result);

                return result;
            });
        },
    };
}