const path = require('path')

export default {
  root: path.resolve(__dirname, 'src'),
  resolve: {
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
    }
  },
  server: {
    port: 8080,
    hot: true,
    watch: {
        usePolling: true
    }
  },
  build: {
    sourcemap: true,
    // output into Django's static dir
    outDir: "../omero_figure/static/omero_figure/"
  },

  assetsInclude: ["**/*.template.html"],
  base: "/figure/"
}
