# Contribution Guide

Hello there! First and foremost, thank you for your interest in Noodel. If you are also considering to contribute to this project, you are very much welcome! 

## How you can contribute

At this stage, Noodel is a brand new project that has just started. Many aspects of it are still works in progress. As such, this guideline is just a basic draft, to be ironed out in the days to come. 

This also means there are many things you can contribute to. Including but not limited to:
- Reporting bug and issues
- Suggesting features and enhancements
- Maintaining documentation
- Creating example sites
- Spreading the word

## Roadmap

Some planned features/enhancements for the future include, but not limited to:
- Adding proper testing to the project
- Integration with Vue and possibly other frameworks like React
- Addressing certain UX issues in mobile browsers
- Fine-tuning navigation experience and performance
- Support for adding custom classes/styles to individual noodes
- More options related to layout and positioning 

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
After you've downloaded the project, do `npm install` to install all dependencies. 

You can then use either:
- `npm run build` to build the js bundle
- `npm run serve` to create a hot-reloading server that can serve your HTML pages for testing purposes. The built files will be automatically injected. Note that for this to work, you need to create an `index.html` page under a folder named `public` in the project root, as well as a `main.ts` file under the `src` folder where you can write your entry point to use the library. These files will be omitted from git.

The project is scaffolded using [vue-cli](https://cli.vuejs.org/). Refer to its docs for more information.

## Pull requests
If you are interested in making a pull request, it'll be much appreciated. Please:
- Make your pull request against the `master` branch
- Provide a clear description of what you did
- Make a reference to any Github issue(s) you are addressing

I'll respond to it as best as I can.