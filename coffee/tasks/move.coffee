
path = require 'path'
fs = require 'fs-extra'
globals = require './globals'
grunt = null
options = null

moveFiles =

	src : ''
	dest : ''

	normalizePaths : (src)->
		srcPath = src.replace @base, ''
		newSrc = path.resolve path.join(@base, srcPath)
		newDest = path.resolve path.join(@baseDest, srcPath)
		{
			src : newSrc
			dest : newDest
		}

	setFileArray : (files, key, dir = '')->
		toExclude = []
		@files[key] = []
		for file in files
			if file.indexOf('!') > -1
				toExclude.push file.replace('!', '')
		for file in files
			if file.indexOf('!') > -1
				continue
			srcFile = path.resolve path.join( @src, file )
			destFile = path.resolve path.join( @dest, file )
			unless grunt.file.exists srcFile
				continue
			if grunt.file.isDir(srcFile)
				grunt.file.recurse srcFile, (abspath)=>
					if toExclude.length
						for exclude in toExclude
							unless abspath.indexOf(exclude) > -1
								obj = @normalizePaths(abspath)
								@files[key].push
									src : obj.src
									dest : obj.dest
			else
				@files[key].push
					src : srcFile
					dest : destFile

	moveFiles : ->
		for key, files of @files
			for file in files
				if grunt.file.isDir file.src
					@moveFilesForFolder file.src, file.dest
				else
					@moveFile file.src, file.dest

	moveFilesForFolder : (src, dest)->
		grunt.file.recurse src, (abspath)=>
			obj = @normalizePaths(abspath)
			@moveFile obj.src, obj.dest

	moveFile : (src, dest)->
		if src.indexOf('.DS_Store') > -1
			return
		console.log src
		console.log dest
		grunt.file.copy src, dest

	baseFiles : ->
		files = ['.csscomb.json', '.editorconfig', 'Gruntfile.js', 'LICENSE', 'package.json', 'README.md']
		@setFileArray files, 'base'

	privateFiles : ->
		files = ['.notes', 'scripts']
		@setFileArray files, 'private'

	publicFiles : ->
		files = ['build', 'unittests', '!results']
		@setFileArray files, 'public'

	movePublicGruntfile : ->
		file = @normalizePaths '.public/Gruntfile.js'
		src = file.src
		dest = path.resolve file.dest.replace('.public', '')
		@moveFile src, dest

	init : ->
		grunt = globals.grunt
		options = globals.options
		@files = {}

	run : ->
		@init()

		@base = @src = path.resolve options.move.src
		@baseDest = @dest = path.resolve options.move.dest
		if options.debug
			console.log 'options.move.base ', @base
			console.log 'options.move.src ', @src
			console.log 'options.move.dest ', @dest
			return

		@baseFiles()
		@privateFiles()
		@publicFiles()
		@moveFiles()
		@movePublicGruntfile()


module.exports = moveFiles
