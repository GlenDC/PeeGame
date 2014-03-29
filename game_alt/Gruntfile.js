module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    concat: {
      options: { separator: ';', },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/game.js',
      },
    },
    watch: {
      files: ['src/**/*.js'],
      tasks: ['concat'],
    }
  });

  // Default task.
  grunt.registerTask('default', ['concat', 'watch']);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

};

