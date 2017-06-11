# TransModule
Convert different JavaScript module systems to equivalent syntaxes.

This is a "throwaway" script I have made for converting systems primarily built with RequireJS to other, more modern syntaxes
like ES6 modules or RequireJS. It is by no means bulletproof and only allows for the most basic of modules uses (Any submodules
imported via ES6s features or attributes on CommonJS requires will cause the file to be improperly converted. 

If a system is using RequireJS, however, this script __should__ work. Make sure to backup and commit every couple of files
when using this.
