import gulp from 'gulp';
import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cleanCSS from 'gulp-clean-css';
import uglify from 'gulp-uglify-es';
import del from 'del';
import browserSync from 'browser-sync';
import svgSprite from 'gulp-svg-sprite';
import sourcemaps from 'gulp-sourcemaps';
import htmlmin from 'gulp-htmlmin';
import notify from 'gulp-notify';
import concat from 'gulp-concat';
import gulpif from 'gulp-if';

const { src, dest, series, watch } = gulp;
const bs = browserSync.create();

let prod = false;

const isProd = (done) => {
  prod = true;
  done();
}

const clean = () => del(['app/*']);

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
    .pipe(gulpif(prod, cleanCSS({ level: 2 })))
    .pipe(gulpif(!prod, sourcemaps.write('.')))
    .pipe(dest('dist'))
    .pipe(bs.stream());
};

const scripts = () => {
  return src(['./src/js/components/**.js', './src/js/main.js'])
    .pipe(gulpif(!prod, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(prod, concat('main.js')))
    .pipe(gulpif(prod, uglify.default({
      toplevel: true
    }).on("error", notify.onError())))
    .pipe(gulpif(!prod, sourcemaps.write()))
    .pipe(dest('dist'))
    .pipe(bs.stream());
}

const resources = () => src('./src/resources/**').pipe(dest('./app'));

const images = async () => {
  const image = (await import('gulp-image')).default;
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
    .pipe(dest('./app/img'));
};

const watchFiles = () => {
  bs.init({
    server: {
      baseDir: "./src"
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
    .pipe(gulpif(prod, htmlmin({ collapseWhitespace: true })))
    .pipe(dest('app'))
    .pipe(bs.stream());
}

export { styles, htmlMinify, scripts };

export const dev = series(clean, scripts, styles, resources, images, svgSprites, htmlMinify, watchFiles);
export const build = series(isProd, clean, scripts, styles, resources, images, svgSprites, htmlMinify);
