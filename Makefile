# Version
VERSION = 0.3.1

# Closure
# [usage] ${CLOSURE} --js=path/to/full.js > path/to/full.min.js
CLOSURE = java -jar ./build/closure/compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS

# r.js
R_JS = java -classpath ./build/rhino/js.jar:./build/closure/compiler.jar org.mozilla.javascript.tools.shell.Main
R_DIR = ./build/require

# wrap.py
WRAP = python ./build/wrapper/wrapper.py

# Deploy
DIST_DIR = ./dist

# Source
#	Module
MODULE_IN = ./script/wrapper-module.js
MODULE_OUT = ${DIST_DIR}/stof-module-${VERSION}.js
MODULE_OUT_MIN = ${DIST_DIR}/min/stof-module-${VERSION}.min.js
#	AMD (requireJS)
AMD_IN = ./script/wrapper-require.js
AMD_OUT = ${DIST_DIR}/stof-require-${VERSION}.js
AMD_OUT_MIN = ${DIST_DIR}/min/stof-require-${VERSION}.min.js
STOF_FILE = ./script/scrolltop-overflow.js

all: wrap minify

wrap:
	@echo '==> wrapping scrolltop-overflow for module and AMD $<'
	@@${WRAP} --stof ${STOF_FILE} --in ${AMD_IN} --out ${AMD_OUT};
	@@${WRAP} --stof ${STOF_FILE} --in ${MODULE_IN}  --out ${MODULE_OUT};
	@echo

minify:
	@echo '==> minifying stof amd $<'
	@@${R_JS} ${R_DIR}/r-1.0.8.js -o ${R_DIR}/scrolltop-overflow.build.js;
	@echo '==> ${AMD_OUT_MIN} $<'
	@echo '==> minifying stof module $<'
	@@${CLOSURE} --js=${MODULE_OUT} > ${MODULE_OUT_MIN}
	@echo '==> ${MODULE_OUT_MIN} $<'