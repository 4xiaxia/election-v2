const fs = require('fs');
const Path = require('path');
const Router = require('koa-router');

const router = new Router()
const routes = []

function buildRoutePaths(file, method) {
  const path = '/' + file.substr(0, file.length - 3) + '/' + method
  return [path, '/api' + path]
}

function registerRoute(mapping, way, method, path) {
  if (mapping.config && mapping.config[method]) router[way](path, mapping.config[method], mapping[way][method])
  else router[way](path, mapping[way][method])
  routes.push({ method: way.toUpperCase(), path })
}

const relativeRouter = dir => {
  const relativePath = dir || Path.resolve(__dirname, '..')
  const files = fs.readdirSync(relativePath + '/api')
  const jsFiles = files.filter( f => f.endsWith('.js'))
  jsFiles.map(file => {
    let mapping = require(relativePath + '/api/' + file)
    for (let way in mapping) {
      if (way !== 'config') {
        for (let method in mapping[way]) {
          buildRoutePaths(file, method).forEach(path => registerRoute(mapping, way, method, path))
        }
      }
    }
  })
  console.log('\nRegistered routes:')
  console.table(routes)
  return router.routes()
}

module.exports = relativeRouter
module.exports.buildRoutePaths = buildRoutePaths
