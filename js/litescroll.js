/** 
 * Lite Scroll
 * 
 * @version    0.3.5
 * @author     Aiden Foxx
 * @license    MIT License 
 * @copyright  2015 Aiden Foxx
 * @link       http://github.com/aidenfoxx
 * @twitter    @furiousfoxx
 */ 

'use strict';

/**
 * @constructor
 */
function LiteScroll(container, options)
{
    if (!(this instanceof LiteScroll))
        return new LiteScroll(container, options);
    
    this.container = container;
    this.content = container.children[0];

    this.scrollCallback = null;
    this.scrollLock = null;
    this.scrollEvent = null;
    this.scrollBegin = null;
    this.scrollFrame = null;

    this.scrollInitVec = { x: 0, y: 0 };
    this.scrollInitMouseVec = { x: 0, y: 0 };

    this.resizeTimeout = null;

    this.containerRect = null;
    this.contentRect = null;
    this.childRect = null;

    this.x = 0;
    this.y = 0;

    this.options = {
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

    for (var key in options)
        this.options[key] = options[key];

    this.resizeCallback();
    this.bindEvents();
}

LiteScroll.prototype.scrollStart = function(e) { }
LiteScroll.prototype.scroll = function(e) { }
LiteScroll.prototype.scrollEnd = function(e) { }

LiteScroll.prototype.calcRelativePos = function(x, y)
{
    return { x: x - this.containerRect.left, y: y - this.containerRect.top };
}

LiteScroll.prototype.calcTouchCoords = function(e)
{
    return this.calcRelativePos(!e.changedTouches ? e.pageX : e.changedTouches[0].pageX, !e.changedTouches ? e.pageY : e.changedTouches[0].pageY);
}

LiteScroll.prototype.clacPointDistance = function(point1, point2)
{
    var distX = point2.x - point1.x;
    var distY = point2.y - point1.y;
    return Math.sqrt((distX * distX) + (distY * distY));
}

LiteScroll.prototype.calcNearestChild = function()
{
    var nearest = null;
    var nearestIndex = 0;

    for (var i = 0, len = this.childRect.length; i < len; i++)
    {
        var pos = this.calcRelativePos(this.childRect[i].left, this.childRect[i].top);
        pos.x = -pos.x;
        pos.y = -pos.y;
        var distance = this.clacPointDistance(this, pos);

        if (!i || distance < nearest)
        {
            nearest = distance;
            nearestIndex = i;
        }
    }
    return nearestIndex;
}

LiteScroll.prototype.getChildRect = function()
{
    var children = [];
    var transformBackup = this.content.style.transform;

    // This will return incorrect values if the transform is in effect
    this.content.style.transitionDuration = '0ms';
    this.content.style.transform = this.content.style.webkitTransform = 'translate(0px, 0px)';

    for (var i = 0, len = this.content.children.length; i < len; i++)
        children.push(this.content.children[i].getBoundingClientRect());

    this.content.style.transform = this.content.style.webkitTransform = transformBackup;

    return children;
}

LiteScroll.prototype.bindEvents = function()
{
    this.container.addEventListener('mousedown', this._scrollStart.bind(this));
    this.container.addEventListener('touchstart', this._scrollStart.bind(this));
    this.container.addEventListener('pointerdown', function(e) { if (e.pointerType === 'touch' || e.pointerType === 'pen') this._scrollStart(e); }.bind(this));
    this.container.addEventListener('MSPointerDown', function(e) { if (e.pointerType === 'touch' || e.pointerType === 'pen') this._scrollStart(e); }.bind(this));

    document.addEventListener('mouseup', this._scrollEnd.bind(this));
    document.addEventListener('touchend', this._scrollEnd.bind(this));
    document.addEventListener('touchcancel', this._scrollEnd.bind(this));
    document.addEventListener('pointerout', function(e) { if (e.pointerType === 'touch' || e.pointerType === 'pen') this._scrollEnd(e); }.bind(this));
    document.addEventListener('MSPointerOut', function(e) { if (e.pointerType === 'touch' || e.pointerType === 'pen') this._scrollEnd(e); }.bind(this));

    if (this.options.dynamicResize)
        window.addEventListener('resize', this.resize.bind(this));
}

LiteScroll.prototype.resize = function()
{
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(function() { this.resizeCallback(); }.bind(this), 500);
}

LiteScroll.prototype.resizeCallback = function()
{
    this.containerRect = this.container.getBoundingClientRect();
    this.contentRect = this.content.getBoundingClientRect();
    this.childRect = this.getChildRect();
}

LiteScroll.prototype.scrollTo = function(x, y, speed, easing, callback)
{
    // Better performance from rounded numbers
    x = Math.round(x);
    y = Math.round(y);

    // Check for axis locking
    if (this.options.scrollX && this.scrollLock !== 'y' && this.x !== x)
    {
        var contentWidth = this.contentRect.width - this.containerRect.width;
        // Collision detection
        if (x > 0 || x < -contentWidth)
        {
            var moveX = this.x - x;
            x = x > 0 ? 0 : -contentWidth;
            var clampX = Math.abs(this.x - x) / Math.abs(moveX);
        }

        this.x = x;
    }

    if (this.options.scrollY && this.scrollLock !== 'x' && this.y !== y)
    {
        var contentHeight = this.contentRect.height - this.containerRect.height;

        if (y > 0 || y < -contentHeight)
        {
            var moveY = this.y - y;
            y = y > 0 ? 0 : -contentHeight;
            var clampY = Math.abs(this.y - y) / Math.abs(moveY);
        }

        this.y = y;
    }

    if (!clampX && clampY)
        speed *= clampY;
    else if (clampX && !clampY)
        speed *= clampX;
    else if (clampX && clampY)
        speed *= clampX < clampY ? clampX : clampY;

    this.content.style.transform = this.content.style.webkitTransform  = 'translate(' + this.x + 'px, ' + this.y + 'px)' + (this.gpuAcceleration ? ' translateZ(0px)' : '');
    this.content.style.transitionDuration = speed + 'ms';
    this.content.style.transitionTimingFunction = easing;
    
    clearTimeout(this.scrollCallback);

    if (callback)
        this.scrollCallback = setTimeout(callback.bind(this), speed);
}

LiteScroll.prototype.snapTo = function(i, speed, easing, callback)
{
    if (!this.childRect[i])
        return false;
    var snapPos = this.calcRelativePos(this.childRect[i].left, this.childRect[i].top);
    this.scrollTo(-snapPos.x, -snapPos.y, speed >= 0 ? speed : this.options.snapSpeed, easing ? easing : 'cubic-bezier(0.1, 0.55, 0.1, 1)', callback);
}

LiteScroll.prototype.snapToNearest = function(speed, easing, callback)
{
    return this.snapTo(this.calcNearestChild(), speed, easing, callback);   
}

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.scrollEvent)
    {
        this.scrollBegin = Date.now();
        this.scrollInitMouseVec = this.calcTouchCoords(e);
        this.scrollInitVec = { x: this.x, y: this.y };
        this.scrollEvent = this._scroll.bind(this);
        this.container.addEventListener('mousemove', this.scrollEvent);
        this.container.addEventListener('touchmove', this.scrollEvent);
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    e.preventDefault();
    window.cancelAnimationFrame(this.scrollFrame);
    this.scrollFrame = window.requestAnimationFrame(function() { this._scrollFrame(e); }.bind(this));
}

LiteScroll.prototype._scrollFrame = function(e)
{
    var mousePos = this.calcTouchCoords(e);
    var moveX = mousePos.x - this.scrollInitMouseVec.x;
    var moveY = mousePos.y - this.scrollInitMouseVec.y;

    if (this.options.scrollLock && !this.scrollLock)
    {
        // Lock if we move enough pixels in one direction
        if (this.options.scrollX && Math.abs(moveX) > this.options.scrollLockThreshold)
            this.scrollLock = 'x';
        if (this.options.scrollY && Math.abs(moveY) > this.options.scrollLockThreshold)
            this.scrollLock = 'y';   
    }

    this.scrollTo(this.scrollInitVec.x + moveX, this.scrollInitVec.y + moveY, 0, 'linear');
    this.scroll(e); 
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.scrollEvent)
    {
        window.cancelAnimationFrame(this.scrollFrame);
        
        var mousePos = this.calcTouchCoords(e);
        var moveX = mousePos.x - this.scrollInitMouseVec.x;
        var moveY = mousePos.y - this.scrollInitMouseVec.y;

        if (this.options.momentum)
        {
            var dragTime = Date.now() - this.scrollBegin;

            // Based on movement since we started dragging
            var velX = moveX / dragTime;
            var velY = moveY / dragTime;

            // Use the highest velocity accounting for scrollLock
            var animationLength = Math.abs(this.scrollLock === 'x' || Math.abs(velX) > Math.abs(velY) ? velX : velY) / this.options.momentumFalloff;
            
            // Calculate final position
            var newX = this.x + (Math.abs(velX) * velX) / (this.options.momentumFalloff * 2);
            var newY = this.y + (Math.abs(velY) * velY) / (this.options.momentumFalloff * 2);

            this.scrollTo(newX, newY, animationLength, 'cubic-bezier(0.165, 0.840, 0.440, 1.000)', this.options.snap ? this.snapToNearest : null);
        }
        else if (this.options.snap)
        {
            this.snapToNearest();
        }

        this.container.removeEventListener('mousemove', this.scrollEvent);
        this.container.removeEventListener('touchmove', this.scrollEvent);
        this.scrollEvent = null;
        this.scrollLock = null;
        
        this.scrollEnd(e);
    }
}