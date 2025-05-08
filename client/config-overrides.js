module.exports = function override(config, env) {
  if (config.devServer) {
    config.devServer.proxy = {
      '/api': 'http://localhost:5001'
    };
  }
  return config;
}; 