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
    this.dragScrollVec = { x: 0, y: 0 };

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

    // Check for axis locking.
    if (this.options.scrollX && this.scrollLock !== 'y')
    {
        var contentWidth = this.contentRect.width - this.containerRect.width;
        var moveX = this.x - x;

        // Collision detection.
        if (x > 0 || x < -contentWidth)
        {
            x = x > 0 ? 0 : -contentWidth;
            clamp = Math.abs(this.x - x) / Math.abs(moveX);
        }

        this.x = Math.round(x);
    }

    if (this.options.scrollY && this.scrollLock !== 'x')
    {
        var contentHeight = this.contentRect.height - this.containerRect.height;
        var moveY = this.y - y;

        if (y > 0 || y < -contentHeight)
        {
            y = y > 0 ? 0 : -contentHeight;
            var clampY = Math.abs(this.y - y) / Math.abs(moveY);
            clamp = !clamp || clamp > clampY ? clampY : clamp;
        }

        this.y = Math.round(y);
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

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.dragEvent)
    {
        this.dragStart = Date.now();
        this.dragMouseVec = this.calcTouchCoords(e);
        this.dragScrollVec = { x: this.x, y: this.y };
        this.dragEvent = this._scroll.bind(this);
        this.container.addEventListener('mousemove', this.dragEvent);
        this.container.addEventListener('touchmove', this.dragEvent);
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    e.preventDefault();

    var pos = this.calcTouchCoords(e);
    var moveX = pos.x - this.dragMouseVec.x;
    var moveY = pos.y - this.dragMouseVec.y;

    if (this.options.scrollLock && !this.scrollLock)
    {
        // If it's moved more pixels
        if (this.options.scrollX && (moveX > this.options.scrollLockThreshold || moveX < -this.options.scrollLockThreshold) && moveY < this.options.scrollLockThreshold && moveY > -this.options.scrollLockThreshold)
            this.scrollLock = 'x';
        if (this.options.scrollY && (moveY > this.options.scrollLockThreshold || moveY < -this.options.scrollLockThreshold) && moveX < this.options.scrollLockThreshold && moveX > -this.options.scrollLockThreshold)
            this.scrollLock = 'y';   
    }

    this.scrollTo(this.dragScrollVec.x + moveX, this.dragScrollVec.y + moveY, 0, 'linear');
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.dragEvent)
    {
        var callback = null;

        if (this.options.snap)
        {
            callback = function()
            {
                var closest = null;
                var closestIndex = 0;

                for (var i = 0, len = this.childRect.length; i < len; i++)
                {
                    var pos = this.calcRelativePos(this.childRect[i].left, this.childRect[i].top);
                    pos.x = -pos.x;
                    pos.y = -pos.y;
                    var distance = this.clacPointDistance(this, pos);

                    if (!i || distance < closest)
                    {
                        closest = distance;
                        closestIndex = i;
                    }
                }

                this.snapTo(closestIndex);
            }
        }

        if (this.options.momentum)
        {
            var pos = this.calcTouchCoords(e);
            var dragTime = Date.now() - this.dragStart;

            // Based on movement since we started dragging
            var velX = (pos.x - this.dragMouseVec.x) / dragTime;
            var velY = (pos.y - this.dragMouseVec.y) / dragTime;

            // Use the highest velocity accounting for scrollLock
            var animationLength = Math.abs(this.lockScroll === 'x' || Math.abs(velX) > Math.abs(velY) ? velX : velY) / this.options.momentumFalloff;
            
            // Includes distance calculation
            var newX = this.x + (Math.abs(velX) * velX) / (this.options.momentumFalloff * 2);
            var newY = this.y + (Math.abs(velY) * velY) / (this.options.momentumFalloff * 2);

            this.scrollTo(newX, newY, animationLength, 'cubic-bezier(0.25, 0.45, 0.45, 0.95)', callback);
        }
        else if (callback)
        {
            callback.bind(this)();
        }

        this.container.removeEventListener('mousemove', this.dragEvent);
        this.container.removeEventListener('touchmove', this.dragEvent);
        this.dragEvent = null;
        this.scrollLock = null;
        
        this.scrollEnd(e);
    }
}