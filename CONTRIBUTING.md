# Contribution Guide
Hello! First, thank you for your interest in Noodel. If you are also considering to contribute, you are most welcome! 

## How you can contribute
At this stage, Noodel is quite a new project, and many aspects of it are works in progress. As such, this guideline is just a draft, to be ironed out in the days to come. 

This also means there are many things you can contribute. Including but not limited to:
- Reporting bug and issues
- Suggesting features and enhancements
- Improving documentation
- Making examples for showcasing features
- Improving tests
- Spreading the word

## Roadmap
Some possible features/enhancements for the future include, but not limited to:
- Improve test coverage
- Add API methods for node relocation and reordering
- Integration with other forms of content, e.g. markdown
- Integration with other frameworks e.g. React
- More styling themes
- Utility libraries/plugins for various needs, e.g. overflow detection

## Bug reports
Please use Github issues for bug reports. As a general rule, please provide:
- The environment under which the bug occurred (Noodel's version, your browser's type and version)
- The expected behaviour
- The actual behaviour
- If possible, provide steps for reproduction or link to a sandbox

## Feature/enhancement requests
Please use Github issues for submitting feature/enhancement requests. This can also include improvements to documentation. As a general rule, please provide:
- A detailed description of the feature/enhancement
- An explanation of why it is needed
- If applicable, provide examples of said feature/enhancement

## Creating example sites
Help is especially wanted for making example sites that use Noodel! It'll be great for showcasing the framework (and learning about its possibilities and limitations). These sites can be about any topic and in any structure. If you have an idea for such a site, or you have built a site using Noodel that you want the project to link to, please make your proposal as a feature request :)

## Building the project
The project is managed using npm and webpack.

After you've downloaded the project, do `npm install` to install all dependencies. 

You can then use either:
- `npm run build` to build the js and css bundles for production
- `npm run test` to run a server with live reloading (using webpack-dev-server) that serves the test html pages to run in the browser. There is both a unit test page and a manual test page (for experimenting with things during development).

## Pull requests
Pull requests are welcome. Please:
- Make your pull request against the `master` branch
- Provide a clear description of what you did
- Make a reference to any Github issue(s) you are addressing

I'll respond to it as best as I can.