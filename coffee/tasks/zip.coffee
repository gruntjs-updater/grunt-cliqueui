
require 'shelljs/global'
path = require 'path'

module.exports =

	src : ''
	dest : ''

	test : ->
		@bin = which('zip')
		if ! @bin
			throw new Error '`zip` command not found. Exiting.'

	zip : (src = @src, dest = @dest)->
		@test()
		dirname = path.dirname src
		basename = path.basename src
		cmd = "#{@bin} -rq #{dest} #{basename}"
		cd dirname
		exec cmd, [false, false]

