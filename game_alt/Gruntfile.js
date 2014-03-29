module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',

    coffee: {
      compile: {
        options: {},
        files: {
          'dist/game.js': 'src/**/*.coffee'
        }
      }
    },
    watch: {
      files: ['src/**/*.coffee'],
      tasks: ['coffee'],
    }
  });

  // Default task.
  grunt.registerTask('default', ['coffee', 'watch']);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');

};

