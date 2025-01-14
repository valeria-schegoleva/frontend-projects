const {src, dest, series, watch} = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify-es').default;
const del = require('del');
const browserSync = require('browser-sync').create();
const svgSprite = require('gulp-svg-sprite');
const sourcemaps = require('gulp-sourcemaps');
const htmlmin = require('gulp-htmlmin');
const notify = require('gulp-notify');
const image = require('gulp-image');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');

let prod = false;

const isProd = (done) => {
  prod = true;
  done();
}

const clean = () => {
	return del(['app/*'])
}

const svgSprites = () => {
  return src('./src/img/svg/**.svg')
    .pipe(svgSprite({
      mode: {
        stack: {
          sprite: "../sprite.svg"
        }
      },
    }))
    .pipe(dest('./app/img'));
}

const styles = () => {
  return src('./src/styles/**/*.css')
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(concat('main.css'))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(gulpif(prod, cleanCSS({
      level: 2
    })))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
};

const scripts = () => {
  return src(
    ['./src/js/components/**.js', './src/js/main.js'])
    .pipe(gulpif(!prod, sourcemaps.init()))
		.pipe(babel({
			presets: ['@babel/env']
		}))
    .pipe(gulpif(prod, concat('main.js')))
    .pipe(gulpif(prod, uglify({
      toplevel: true
    }).on("error", notify.onError())))
    .pipe(gulpif(!prod, sourcemaps.write()))
    .pipe(dest('dist'))
    .pipe(browserSync.stream());
}

const resources = () => {
  return src('./src/resources/**')
    .pipe(dest('./app'))
}

const images = () => {
  return src([
		'./src/img/**.jpg',
		'./src/img/**.png',
		'./src/img/**.jpeg',
		'./src/img/*.svg',
		'./src/img/**/*.jpg',
		'./src/img/**/*.png',
		'./src/img/**/*.jpeg'
		])
    .pipe(image())
    .pipe(dest('./app/img'))
};

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./app"
    },
  });

  watch('./src/**/*.css', styles);
	watch('./src/**/*.html', htmlMinify);
  watch('./src/js/**/*.js', scripts);
  watch('./src/resources/**', resources);
  watch('./src/img/*.{jpg,jpeg,png,svg}', images);
	watch('./src/img/**/*.{jpg,jpeg,png}', images);
  watch('./src/img/svg/**.svg', svgSprites);
}

const htmlMinify = () => {
	return src('src/*.html')
    .pipe(gulpif(prod, htmlmin({
      collapseWhitespace: true
    })))
		.pipe(dest('app'))
		.pipe(browserSync.stream())
}

exports.styles = styles;
exports.htmlMinify = htmlMinify;
exports.scripts = scripts;

exports.dev = series(clean, scripts, styles, resources, images, svgSprites, htmlMinify, watchFiles);
exports.build = series(isProd, clean, scripts, styles, resources, images, svgSprites, htmlMinify);
