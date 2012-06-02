# Closure
# [usage] ${CLOSURE} --js=path/to/full.js > path/to/full.min.js
CLOSURE = java -jar ./build/closure/compiler.jar --compilation_level=SIMPLE_OPTIMIZATIONS

# Source
STOF_FILES = ./scrolltop-overflow.js ./scrolltop-overflow.amd.js

# Deploy
DIST_DIR = ./dist

all: deploy

deploy:
	@echo '==> minifying and deploying scrolltop-overflow flavors $<'
	@@mkdir -p ${DIST_DIR};
	@@for file in ${STOF_FILES}; do \
	   echo ===minify: $$file...===; \
	   ${CLOSURE} --js=$$file > ${DIST_DIR}/`basename $$file`; \
	   done;
	@echo
