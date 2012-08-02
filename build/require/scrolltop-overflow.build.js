({
	baseUrl: '../..',
    paths: {
    	"dist": './dist',
    },
    modules: [
    	{
    		name: 'dist/stof-require-0.3.1'
    	}
    ],
    out: '../../dist/min/stof-require-0.3.1.min.js',
    optimize: "closure",
    wrap: true
})