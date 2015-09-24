/** 
 * Lite Scroll
 * 
 * @version    0.3.0
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
    this.resizeTimeout = null;
    this.dragEvent = null;
    this.dragStart = null;

    this.x = 0;
    this.y = 0;

    this.dragMouseVec = { x: 0, y: 0 };
    this.dragStartVec = { x: 0, y: 0 };

    this.options = {
        scrollX: false,
        scrollY: true,
        snap: false,
        snapSpeed: 300,
        dynamicResize: true,
        scrollLock: true,
        scrollLockThreshold: 20,
        momentum: true,
        momentumFalloff: .008
    };

    for (var key in options)
        this.options[key] = options[key];

    // Everything gets cached
    this.containerRect = this.container.getBoundingClientRect();
    this.contentRect = this.content.getBoundingClientRect();
    this.childRect = this.options.snap ? this.getChildRect() : [];

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

LiteScroll.prototype.getChildRect = function()
{
    var children = [];
    var transformBackup = this.content.style.transform;

    // This will return incorrect values if the transform is in effect
    this.content.style.transitionDuration = '0ms';
    this.content.style.transform = 'translate(0px, 0px) translateZ(0px)';

    for (var i = 0, len = this.content.children.length; i < len; i++)
        children.push(this.content.children[i].getBoundingClientRect());

    this.content.style.transform = transformBackup;

    return children;
}

LiteScroll.prototype.bindEvents = function()
{
    this.container.addEventListener('mousedown', this._scrollStart.bind(this));
    this.container.addEventListener('touchstart', this._scrollStart.bind(this));

    window.addEventListener('mouseup', this._scrollEnd.bind(this));
    window.addEventListener('touchend', this._scrollEnd.bind(this));
    window.addEventListener('touchcancel', this._scrollEnd.bind(this));
    
    if (this.options.dynamicResize)
        window.addEventListener('resize', this.resize.bind(this));
}

LiteScroll.prototype.resize = function()
{
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(function() {
        this.containerRect = this.container.getBoundingClientRect();
        this.contentRect = this.content.getBoundingClientRect();
        this.childRect = this.options.snap ? this.getChildRect() : [];
    }.bind(this), 500);
}

LiteScroll.prototype.scrollTo = function(x, y, speed, easing, callback)
{
    var clamp = false;

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
            clamp = Math.abs(this.x - x) / Math.abs(moveX);
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
            clamp = !clamp || clamp > clampY ? clampY : clamp;
        }

        this.y = y;
    }

    if (clamp) speed *= clamp;

    this.content.style.transitionDuration = speed + 'ms';
    this.content.style.transitionTimingFunction = easing;
    this.content.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';

    clearTimeout(this.scrollCallback);

    if (callback)
        this.scrollCallback = setTimeout(callback.bind(this), speed);
}

LiteScroll.prototype.snapTo = function(i, callback)
{
    var snapVec = this.calcRelativePos(this.childRect[i].left, this.childRect[i].top);
    this.scrollTo(-snapVec.x, -snapVec.y, this.options.snapSpeed, 'cubic-bezier(0.1, 0.55, 0.1, 1)', callback);
}

LiteScroll.prototype.snapToNearest = function(callback)
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

    this.snapTo(nearestIndex, callback);   
}

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.dragEvent)
    {
        this.dragStart = Date.now();
        this.dragMouseVec = this.calcTouchCoords(e);
        this.dragStartVec = { x: this.x, y: this.y };
        this.dragEvent = this._scroll.bind(this);
        this.container.addEventListener('mousemove', this.dragEvent);
        this.container.addEventListener('touchmove', this.dragEvent);
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    e.preventDefault();

    var mousePos = this.calcTouchCoords(e);
    var moveX = mousePos.x - this.dragMouseVec.x;
    var moveY = mousePos.y - this.dragMouseVec.y;

    if (this.options.scrollLock && !this.scrollLock)
    {
        // Lock if we move enough pixels in one direction
        if (this.options.scrollX && (moveX > this.options.scrollLockThreshold || moveX < -this.options.scrollLockThreshold) && moveY < this.options.scrollLockThreshold && moveY > -this.options.scrollLockThreshold)
            this.scrollLock = 'x';
        if (this.options.scrollY && (moveY > this.options.scrollLockThreshold || moveY < -this.options.scrollLockThreshold) && moveX < this.options.scrollLockThreshold && moveX > -this.options.scrollLockThreshold)
            this.scrollLock = 'y';   
    }

    this.scrollTo(this.dragStartVec.x + moveX, this.dragStartVec.y + moveY, 0, 'linear');
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.dragEvent)
    {
        var mousePos = this.calcTouchCoords(e);
        var dragTime = Date.now() - this.dragStart;

        // Based on movement since we started dragging
        var velX = (mousePos.x - this.dragMouseVec.x) / dragTime;
        var velY = (mousePos.y - this.dragMouseVec.y) / dragTime;

        // Use the highest velocity accounting for scrollLock
        var animationLength = Math.abs(this.scrollLock === 'x' || Math.abs(velX) > Math.abs(velY) ? velX : velY) / this.options.momentumFalloff;
        
        // Calculate final position
        var newX = this.x + (Math.abs(velX) * velX) / (this.options.momentumFalloff * 2);
        var newY = this.y + (Math.abs(velY) * velY) / (this.options.momentumFalloff * 2);

        this.scrollTo(newX, newY, animationLength, 'cubic-bezier(0.25, 0.45, 0.45, 0.95)', this.snapToNearest);

        this.container.removeEventListener('mousemove', this.dragEvent);
        this.container.removeEventListener('touchmove', this.dragEvent);
        this.dragEvent = null;
        this.scrollLock = null;
        
        this.scrollEnd(e);
    }
}