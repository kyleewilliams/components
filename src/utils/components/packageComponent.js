const { fileExists, packDir, readFile } = require('@serverless/utils')
const { isNil, isEmpty } = require('ramda')
const path = require('path')
const semver = require('semver')
const log = require('../logging/log')
const validateCoreVersion = require('./validateCoreVersion')

module.exports = async (options) => {
  const format = options.format || 'zip'
  let componentPath = options.path || options.projectPath
  const { serverlessFileObject } = options

  if (!path.isAbsolute(componentPath)) {
    componentPath = path.resolve(process.cwd(), componentPath)
  }

  let slsYml
  if (!isNil(serverlessFileObject) && !isEmpty(serverlessFileObject)) {
    slsYml = serverlessFileObject
  } else {
    const slsYmlFilePath = path.join(componentPath, 'serverless.yml')
    if (!(await fileExists(slsYmlFilePath))) {
      throw new Error(`Could not find a serverless.yml file in ${componentPath}`)
    }
    slsYml = await readFile(slsYmlFilePath)
  }

  validateCoreVersion(slsYml.type, slsYml.core)

  if (semver.valid(slsYml.version) === null) {
    throw new Error('Please provide a valid version for your component')
  }

  const outputFileName = `${slsYml.type}@${slsYml.version}.${format}`
  const outputFilePath = path.resolve(componentPath, outputFileName)

  await packDir(componentPath, outputFilePath)

  log(`Component has been packaged in ${outputFilePath}`)

  return outputFilePath
}
