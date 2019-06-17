const gulp = require('gulp')
const { Storage } = require('@google-cloud/storage')
const cache = require('gulp-cache')
const imageMin = require('gulp-imagemin')
const replace = require('gulp-replace')
const pngquant = require('imagemin-pngquant')
const fs = require('fs').promises
const path = require('path')
const mergeStream = require('merge-stream')

const distDir = path.join(__dirname, 'dist/')
const storage = new Storage({
  projectId: 'tutor-204108',
  keyFilename: './tutor.json'
})

const cleanGCS = async bucketName => {
  const options = {
    prefix: 'app/line@chat/',
  }

  const [files] = await storage.bucket(bucketName).getFiles(options)
  for (let file of files) {
    await storage.bucket(bucketName)
      .file(file.name)
      .delete()
    console.log(`${file.name} is deleted`)
  }
}

const findAllUploadFilesPath = async (dir, multiDistEntireFilePath = []) => {
  const files = await fs.readdir(dir)

  for (let file of files) {
    const entireFilepath = path.join(dir, file)
    const fileStatus = await fs.stat(entireFilepath)

    if (fileStatus.isDirectory()) {
      multiDistEntireFilePath = await findAllUploadFilesPath(entireFilepath, multiDistEntireFilePath)
    } else {
      multiDistEntireFilePath.push(entireFilepath)
    }
  }

  return multiDistEntireFilePath
}

const uploadToGCS = async bucketName => {
  await cleanGCS(bucketName)

  const multiDistEntireFilePath = await findAllUploadFilesPath(distDir)
  multiDistEntireFilePath.forEach(distEntireFilePath => {
    storage.bucket(bucketName)
      .upload(distEntireFilePath,
        {
          destination: `/app/line@chat/${distEntireFilePath.replace(distDir, '')}`,
          metadata: {
            cacheControl: 'no-store',
          },
          public: true
        },
        (err, file) => {
          console.log(`Upload ${file.name} successfully`)
        }
      )
  })
}

const minifyImage = sourceImage => {
  return gulp
    .src(sourceImage, { base: './src' })
    .pipe(cache(imageMin({
      use: [pngquant({
        speed: 7
      })]
    })))
    .pipe(gulp.dest('./dist'))
}

const switchEnv = env => {
  const switchFirebaseAuth = gulp
    .src(['./src/modules/firebase-auth.js'], {
      base: './'
    })
    .pipe(
      replace(/(export default (productionConfig|testConfig))/g, () => {
        if (env === 'test') {
          return 'export default testConfig'
        } else {
          return 'export default productionConfig'
        }
      })
    )
    .pipe(gulp.dest('./'))

  const switchDomain = gulp
    .src(['./src/**/*.@(js|vue)'], {
      base: './'
    })
    .pipe(
      replace(/(www.(ehanlin|tbbt).com.tw)/g, () => {
        if (env === 'test') {
          return 'www.tbbt.com.tw'
        } else {
          return 'www.ehanlin.com.tw'
        }
      })
    )
    .pipe(gulp.dest('./'))

  return mergeStream(switchFirebaseAuth, switchDomain)
}

gulp.task('minifyImage', minifyImage.bind(minifyImage, './src/static/img/**/*.@(jpg|png)'))

/* 上傳 GCS */
gulp.task('uploadToGcsTest', uploadToGCS.bind(uploadToGCS, 'tutor-apps-test/'))
gulp.task('uploadToGcsProduction', uploadToGCS.bind(uploadToGCS, 'tutor-apps/'))
gulp.task('switchTestEnv', switchEnv.bind(switchEnv, 'test'))
gulp.task('switchProductionEnv', switchEnv.bind(switchEnv, 'production'))

/* 部署 */
gulp.task('deployToTest',
  gulp.series('minifyImage', 'uploadToGcsTest')
)

gulp.task('deployToProduction',
  gulp.series('minifyImage', 'uploadToGcsProduction')
)