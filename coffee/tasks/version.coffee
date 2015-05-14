
path = require 'path'
globals = require './globals'

grunt = null
options = null

version =

	src : ''
	dest : ''

	getCurrentVersion : ->
		pkg = path.resolve path.join( @base, 'package.json' )
		@info = grunt.file.readJSON pkg
		@info.version

	incrementVersion : (version = @getCurrentVersion())->
		@oldVersion = version
		array = version.split '.'
		major = parseInt array[0], 10
		minor = parseInt array[1], 10
		patch = parseInt array[2], 10
		if patch is 9
			minor++
			patch = 0
			if minor > 8
				major++
				minor = 0
		else
			patch++
		@newVersion = [major, minor, patch].join('.')

	replaceVersionString : ->
		extensions = ['.php', '.coffee', '.js', '.md', '.json', '.html']
		grunt.file.recurse @base, (abspath)=>
			extension = path.extname abspath
			if abspath.indexOf('node_modules') > -1 or extensions.indexOf(extension) < 0
				return
			basename = path.basename abspath
			if basename is 'package.json'
				content = grunt.file.read abspath
				hasString = content.indexOf '"version": "' + @oldVersion + '",'
				if hasString > -1
					newContent = content.replace @oldVersion, @newVersion
					grunt.file.write abspath, newContent
			else
				content = grunt.file.read abspath
				hasString = content.indexOf @oldVersion
				if hasString > -1
					newContent = content.replace @oldVersion, @newVersion
					grunt.file.write abspath, newContent

	init : ->
		grunt = globals.grunt
		options = globals.options

	run : ->
		@init()

		@base = path.resolve options.version.base
		if options.debug
			console.log 'options.version.base ', @base
			return

		@incrementVersion()
		@replaceVersionString()


module.exports = version
