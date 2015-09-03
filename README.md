# Lite Scroll (Version 0.2.1)
Lite Scroll is a light alternative to iScroll designed to be super light, easily extendable and highly efficient.

Script example (http://foxx.io/litescroll/).

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
    snapSpeed: '300ms',
    dynamicResize: true,
    lockScroll: true,
    momentum: true,
    momentumSpeed: .008
};
```

### 'scrollX' and 'scrollY'
Defined if the element can be scrolled on the X and Y axis.

### 'snap'
Defines if the scroller will snap to elements inside the content container.

### 'snapSpeed'
Defines the length of time the scroller will take to animate snapping.

### 'dynamicResize'
Defines if the script will resize the scroller upon the window changing.

### 'lockScroll'
Defines if the script will lock the scroll axis once the user starts scrolling.

### 'momentum'
Defines if scrolling will have momentum. This will be disabled if snapping is enabled.

### 'momentumFalloff'
This is the speed at which the momentum slows based on pixels per milisecond.

## Methods
The script currently has one useful method avalible.

```javascript
var scroll = LiteScroll(element, options);

// Will scroll the defined coordinates (px, px, ms, transitionTimingFunction)
scroll.scrollTo(x, y, speed, easing)
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
The plugin has been tested and is working in all major web browsers, and supports IE9 and above.

## Future Development
- Add some sort of momentum scrolling.

## License
All code is free to use and distribute under MIT License unless otherwise specified.
