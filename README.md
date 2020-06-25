# Data driven range slider

Add interactivity to your web apps

[![NPM Version](https://d25lcipzij17d.cloudfront.net/badge.svg?id=js&type=6&v=1.0.0&x2=0)](https://npmjs.org/package/data-driven-range-slider) 

<p align="center">
   <!-- Thanks Vasturiano for this trick -  https://github.com/vasturiano -->
     <a href="https://observablehq.com/@bumbeishvili/data-driven-range-slider"><img width="80%" src="https://user-images.githubusercontent.com/6873202/81438390-c0372380-917d-11ea-8c50-e3b25923bdc7.gif"></a>
</p>

D3 and svg based data driven range slider, with good performance

Check out [Introduction](https://dev.to/dbumbeishvili/data-driven-range-slider-introduction-4mj)

Check out examples
* [Observable example](https://observablehq.com/@bumbeishvili/data-driven-range-slider)  (Most Updated)  
* [JSFiddle example](https://jsfiddle.net/079nk83L/2/)

Check out several libraries and frameworks integrations
### Integrations
* [Vue.js Integration](https://stackblitz.com/edit/data-driven-range-slider-vue-integration)  
* [React integration](https://stackblitz.com/edit/data-driven-range-slider-react-integration)  
* [Angular integration](https://stackblitz.com/edit/data-driven-range-slider-angular-integration)  


### Installing

```
npm i data-driven-range-slider
```

### Usage
```javascript
const RangeSlider = require ('https://bundle.run/data-driven-range-slider@1.0.0');


new RangeSlider()
   .container(<myDOMElement>)
   .data(<myData>)
   .accessor(d=> d.<myDataPropertyName>)
   .aggregator(group => group.values.length)
   .onBrush(d=> /* Handle range values */)
  
   .svgWidth(800)
   .svgHeight(100)
   .render()
 
```

## Author
 [David   B (twitter)](https://twitter.com/dbumbeishvili)  
 [David   B (linkedin)](https://www.linkedin.com/in/bumbeishvili/)  

I am available for freelance data visualization work. Please [contact me](https://davidb.dev/contact) in case you'd like me to help you with my experience and expertise
