module.exports = {
  devServer: {
    allowedHosts: 'all',
    host: 'localhost',
    port: 3003,
    proxy: {
      '/api': 'http://localhost:5001'
    }
  }
}; 