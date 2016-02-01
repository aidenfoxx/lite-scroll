# Lite Scroll (Version 0.3.4)
Lite Scroll is a light alternative to iScroll designed to be super light, easily extendable and highly efficient.

Script example (http://projects.foxx.io/litescroll/).

## Usage
The script accepts a number of parameters:

```javascript
var element = document.getElementById('scroll');

var scroll = LiteScroll(element, options);
```

The structure of the HTML follows the syntax:

```html
<div id="scroll">
    <div class="content">
        Content
    </div>
</div>
```

## Options

All avalible options are:

```javascript
var options = {
    scrollX: false,
    scrollY: true,
    snap: false,
    snapSpeed: 300,
    dynamicResize: true,
    scrollLock: true,
    scrollLockThreshold: 20,
    momentum: true,
    momentumFalloff: .006,
    gpuAcceleration: false
};
```

### 'scrollX' and 'scrollY'
Defined if the element can be scrolled on the X and Y axis.

### 'snap'
Defines if the scroller will snap to elements inside the content container.

### 'snapSpeed'
Defines the length of time in milliseconds that the scroller will take to animate snapping.

### 'dynamicResize'
Defines if the script will resize the scroller upon the window changing.

### 'scrollLock'
Defines if the script will lock the scroll axis once the user starts scrolling.

### 'scrollLockThreshold'
Defines the amount of pixels that must be scrolled before the scroll direction is locked.

### 'momentum'
Defines if scrolling will have momentum.

### 'momentumFalloff'
Defines the speed at which the momentum slows based on pixels per millisecond.

### 'gpuAcceleration'
Defines if the script will try to enable GPU acceleration on transitions.

## Methods
The script has multiple avalible methods.

```javascript
var scroll = LiteScroll(element, options);

// Will scroll the defined coordinates (px, px, ms, cssTimingDefinition, function)
scroll.scrollTo(x, y, speed, easing, callback)

// Will snap to a child element of the scroller based on the dom index (int, ms, cssTimingDefinition, function)
scroll.snapTo(domIndex, speed, easing, callback)

// Will snap to the nearest child element of the scroller (ms, cssTimingDefinition, function)
scroll.snapToNearest(speed, easing, callback)
````

## Custom Events
The script has a number of events you can bind functions to or override.

```javascript
var scroll = LiteScroll(element, options);

// Bind the function this specific object
scroll.scrollStart = function(e) { }
scroll.scroll = function(e) { }
scroll.scrollEnd = function(e) { }

// Binds the function to all instances of the script
LiteScroll.prototype.scrollStart = function(e) { }
LiteScroll.prototype.scroll = function(e) { }
LiteScroll.prototype.scrollEnd = function(e) { }
```

When using these events there is a number of useful variables you can access.

```javascript
// The function will be passed a mouse/touch event
scroll.scroll = function(e) {
    // Scroller position
    this.x;
    this.y;
}
```

## Browser Compatibility
The plugin has been tested and is working in all major web browsers, and supports IE10 and above.

## Future Development
- All done for now. I'm open to suggestions.

## License
All code is free to use and distribute under MIT License unless otherwise specified.
