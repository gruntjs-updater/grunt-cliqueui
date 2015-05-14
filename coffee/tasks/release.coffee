
path = require 'path'
fs = require 'fs-extra'
globals = require './globals'
shell = require 'shelljs'
cssmin = require 'clean-css'
uglify = require 'uglify-js'
zip = require './zip'

grunt = null
options = null

release =

	src : ''
	dest : ''
	cssMinOpts :
		advanced : false
		rebase : false
		sourceMap : false
	uglifyOpts :
		banner : ''
		footer : ''
		compress :
			warnings : false
		mangle : {}
		beautify : false
		expression : false
		maxLineLen : 32000
		ASCIIOnly : false

	getDestinationPath : (file)->
		srcPath = file.replace @src, ''
		path.resolve path.join(@dest, srcPath)

	removeMinFiles : ->
		@files.filter (file)->
			basename = path.basename file
			if basename.indexOf('.min') > -1
				fs.unlink file
		return

	setFiles : ->
		@files = []
		unless grunt.file.exists @src
			grunt.log.error "Cannot move files - source doesn't exist.\n(#{@src})"
			return
		if grunt.file.isDir @src
			grunt.file.recurse @src, (abspath)=>
				if abspath.indexOf('.DS_Store') < 0 and abspath.indexOf('.full') < 0
					@files.push abspath
		else if ! grunt.file.isDir(@src)
			@files = [@src]

	makeCompressedName : (file)->
		basename = path.basename file
		extension = path.extname file
		newFilename = basename.replace('.min', '').replace(extension, '.min' + extension)
		file.replace basename, newFilename

	makeCompressedDestName : (file)->
		dest = @getDestinationPath file
		@makeCompressedName dest

	isCSSFile : (file)->
		path.extname(file) is '.css'

	isJSFile : (file)->
		path.extname(file) is '.js'

	isCompressableFile : (file)->
		return @isCSSFile(file) or @isJSFile(file)

	minifyCSS : (file)->
		content = grunt.file.read file
		newFile = @makeCompressedDestName file
		minifiedCSS = new cssmin(@cssMinOpts).minify content
		grunt.file.write newFile, minifiedCSS.styles

	minifyJS : (file)->
		minifiedS = uglify.minify file
		newFile = @makeCompressedDestName file
		grunt.file.write newFile, minifiedS.code

	copyFile : (file)->
		destFile = @getDestinationPath file
		grunt.file.copy file, destFile

	compressFiles : ->
		for file in @files
			@copyFile file
			shouldCompress = @isCompressableFile file
			if ! shouldCompress
				continue
			if @isCSSFile file
				@minifyCSS file
			else if @isJSFile file
				@minifyJS file

	unlinkDestinationFolder : ->
		exists = fs.existsSync @dest
		if exists
			shell.rm '-rf', @dest

	getCurrentVersion : ->
		pkg = path.resolve path.join( @base, 'package.json' )
		info = grunt.file.readJSON pkg
		info.version

	createZipName : ->
		path.resolve path.join( @base, "#{@getCurrentVersion()}.zip" )

	zipFolder : ->
		zip.zip @dest, @createZipName()

	init : ->
		grunt = globals.grunt
		options = globals.options

	run : ->
		@init()

		@base = path.resolve options.release.base
		@src = path.resolve options.release.src
		@dest = path.resolve options.release.dest
		if options.debug
			console.log 'options.release.base ', @base
			console.log 'options.release.src ', @src
			console.log 'options.release.dest ', @dest
			return

		@unlinkDestinationFolder()
		@setFiles()
		@removeMinFiles()
		@compressFiles()
		@zipFolder()


module.exports = release
