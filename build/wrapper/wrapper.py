"""Replaces content of one file at line demarked with @scrolltop-overflow of another file
   (c) Todd Anderson : http://www.custardbelly.com/blog
"""
import getopt, sys, os, fileinput, re
import tempfile, shutil

def readin(path):
	with open(path, 'r') as f:
		return f.read()

def normalize_path(filepath):
	return filepath if os.path.isabs(filepath) else os.path.join(os.getcwd(), filepath)

def wrap(filepath, contents):
	with open(filepath, 'r+') as f:
		if '@scrolltop-overflow' in f.read():
			for line in fileinput.input([filepath], inplace=1):
				if '@scrolltop-overflow' in line:
					line = contents
				sys.stdout.write(line)

if __name__ == '__main__':
	opts, args = getopt.getopt(sys.argv[1:], 'stof:in:out', ['stof=','in=','out='])
	options = dict(opts)
	
	# filepaths from options
	stof = normalize_path(options['--stof'])
	infile = normalize_path(options['--in'])
	outfile = normalize_path(options['--out'])

	# Read in stof & file
	src = readin(stof)
	wrapper = readin(infile)

	# Create temp file
	f = tempfile.NamedTemporaryFile(mode='w+t', delete=False)
	try:
		# 1. write wrapper content to temp. 
		# 2. replace @scrolltop-overflow line with stof content.
		# 3. cleanup.
		name = f.name
		f.write(wrapper)
		f.close()
		wrap(name, src)
		shutil.copy(name, outfile)
		print('wrapped {0}. written to {1}.'.format(infile, outfile))
	except Exception as e:
		print(str(e))
	finally:
		f.close()
		os.remove(f.name)

