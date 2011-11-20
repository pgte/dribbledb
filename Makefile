SRC_DIR = src
TEST_DIR = test
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist
TEST_DIR = ${PREFIX}/tests
TEST_DIST_DIR = ${TEST_DIR}/dist

JS_ENGINE ?= `which node nodejs 2>/dev/null`
JS_LINT ?= `which jslint`
COMPILER = ${JS_ENGINE} ${BUILD_DIR}/uglify.js --unsafe
BROWSERIFY ?= `which browserify`

BASE_FILES = ${SRC_DIR}/request.js\
	${SRC_DIR}/dribbledb.js

MODULES = ${SRC_DIR}/first.js\
	${BASE_FILES} \
	${SRC_DIR}/last.js\

TESTS = ${TEST_DIR}/test.js
TESTS_MODULES = ${TEST_DIR}/build/intro.js \
  ${TEST_DIR}/src/test.js
CONCAT_TESTS = ${TEST_DIST_DIR}/concat.js
TESTS_BROWSERIFIED = ${TEST_DIST_DIR}/browserified.js

DRIBBLEDB = ${DIST_DIR}/dribbledb.js
DRIBBLEDB_MIN = ${DIST_DIR}/dribbledb.min.js

DRIBBLEDB_VER = $(shell cat version.txt)
VER = sed "s/@VERSION/${DRIBBLEDB_VER}/"

DATE=$(shell git log -1 --pretty=format:%ad)

all: core

core: dribbledb
	@@echo "DribbleDB build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

dribbledb: ${DRIBBLEDB}

${DRIBBLEDB}: ${MODULES} | ${DIST_DIR}
	@@echo "Building" ${DRIBBLEDB}

	@@cat ${MODULES} | \
		sed 's/@DATE/'"${DATE}"'/' | \
		${VER} > ${DRIBBLEDB};

lint:
	@@if test ! -z ${JS_LINT}; then \
		echo "Checking DribbleDB against JSLint..."; \
		${JS_LINT} ${MODULES}; \
	else \
		echo "You must have NodeJS installed in order to test DribbleDB against JSLint."; \
	fi

size: dribbledb min
	@@if test ! -z ${JS_ENGINE}; then \
		gzip -c ${JQ_MIN} > ${JQ_MIN}.gz; \
		wc -c ${DRIBBLEDB} ${DRIBBLEDB_MIN} ${DRIBBLEDB_MIN}.gz | ${JS_ENGINE} ${BUILD_DIR}/sizer.js; \
		rm ${DRIBBLEDB_MIN}.gz; \
	else \
		echo "You must have NodeJS installed in order to size DribbleDB."; \
	fi

freq: dribbledb min
	@@if test ! -z ${JS_ENGINE}; then \
		${JS_ENGINE} ${BUILD_DIR}/freq.js; \
	else \
		echo "You must have NodeJS installed to report the character frequency of minified DribbleDB."; \
	fi

min: dribbledb ${DRIBBLEDB_MIN}

${DRIBBLEDB_MIN}: ${DRIBBLEDB}
	@@if test ! -z ${JS_ENGINE}; then \
		echo "Minifying DribbleDB" ${DRIBBLEDB_MIN}; \
		${COMPILER} ${DRIBBLEDB} > ${DRIBBLEDB_MIN}; \
	else \
		echo "You must have NodeJS installed in order to minify DribbleDB."; \
	fi

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
	@@echo "Removing Test Distribution directory:" ${TEST_DIST_DIR}
	@@rm -rf ${TEST_DIST_DIR}

distclean: clean

${CONCAT_TESTS}:
	@@echo 'Concatenating tests into ${CONCAT_TESTS}'; \
	mkdir -p ${TEST_DIST_DIR}; \
	cat ${TESTS_MODULES} > ${CONCAT_TESTS};

${TESTS_BROWSERIFIED}: ${CONCAT_TESTS}
		@@if test ! -z ${BROWSERIFY}; then \
		  echo 'Browserifying ${CONCAT_TESTS}'; \
		  ${BROWSERIFY} ${CONCAT_TESTS} -o ${TESTS_BROWSERIFIED}; \
	  else \
	    echo "Could not find browerify. Try installing it using npm install -g browserify"; \
		fi

test: dribbledb ${TESTS_BROWSERIFIED}
	@@echo "Testing DribbleDB"
	@@testling ${TESTS_BROWSERIFIED}


# change pointers for submodules and update them to what is specified in jQuery
# --merge  doesn't work when doing an initial clone, thus test if we have non-existing
#  submodules, then do an real update
# update the submodules to the latest at the most logical branch
.PHONY: all dribbledb min clean distclean core