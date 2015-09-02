/** 
 * Lite Scroll
 * 
 * @version    0.2
 * @author     Aiden Foxx
 * @license    MIT License 
 * @copyright  2015 Aiden Foxx
 * @link       http://github.com/aidenfoxx
 * @twitter    @furiousfoxx
 */ 

'use strict';

/**
 * CONSTRUCTOR
 */
function LiteScroll(element, options)
{
    if (!(this instanceof LiteScroll))
        return new LiteScroll(element, options);
    
    this.element = element;
    this.content = element.children[0];

    this.lockScroll = null;
    this.resizeTimeout = null;
    this.dragEvent = null;
    this.dragStart = null;

    this.x = 0;
    this.y = 0;

    this.scrollStartVec = { x: 0, y: 0 };
    this.prevScrollVec = { x: 0, y: 0 };

    this.options = {
        scrollX: false,
        scrollY: true,
        snap: false,
        snapSpeed: 300,
        dynamicResize: true,
        lockScroll: true,
        momentum: true,
        momentumSpeed: 4
    };

    for (var key in options)
        this.options[key] = options[key];

    this.elementRect = this.element.getBoundingClientRect();
    this.contentRect = this.content.getBoundingClientRect();
    this.childRect = this.options.snap ? this.getChildRect() : [];

    this.bindEvents();
}

/**
 * VIRTUAL METHODS
 */
LiteScroll.prototype.scrollStart = function(x, y) { }
LiteScroll.prototype.scroll = function(x, y) { }
LiteScroll.prototype.scrollEnd = function(x, y) { }

/**
 * PUBLIC METHODS
 */
LiteScroll.prototype.calcRelativePos = function(x, y)
{
    return { x: x - this.elementRect.left, y: y - this.elementRect.top };
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

LiteScroll.prototype.getTouchCoords = function(e)
{
    return this.calcRelativePos(!e.changedTouches ? e.pageX : e.changedTouches[0].pageX, !e.changedTouches ? e.pageY : e.changedTouches[0].pageY);
}

LiteScroll.prototype.bindEvents = function()
{
    this.element.addEventListener('mousedown', this._scrollStart.bind(this));
    this.element.addEventListener('touchstart', this._scrollStart.bind(this));

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
        this.elementRect = this.element.getBoundingClientRect();
        this.contentRect = this.content.getBoundingClientRect();
        this.childRect = this.options.snap ? this.getChildRect() : [];
    }.bind(this), 500);
}

LiteScroll.prototype.scrollTo = function(x, y, speed, easing)
{
    var contentWidth = this.contentRect.width - this.elementRect.width;
    var contentHeight = this.contentRect.height - this.elementRect.height;

    this.x = x;
    this.y = y;

    // Colission Detection.
    if (x > 0 || x < -(contentWidth))
        this.x = x <= 0 ? -(contentWidth) : 0;
    if (y > 0 || y < -(contentHeight))
        this.y = y <= 0 ? -(contentHeight) : 0;  

    this.content.style.transitionDuration = speed + 'ms';
    this.content.style.transitionTimingFunction = easing;
    this.content.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)'; 
}

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.dragEvent)
    {
        this.dragStart = Date.now();
        this.scrollStartVec = this.getTouchCoords(e);
        this.dragEvent = this._scroll.bind(this);
        this.element.addEventListener('mousemove', this.dragEvent);
        this.element.addEventListener('touchmove', this.dragEvent);
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    e.preventDefault();

    var pos = this.getTouchCoords(e);
    var moveX = pos.x - this.scrollStartVec.x;
    var moveY = pos.y - this.scrollStartVec.y;

    if (this.options.scrollX && this.options.lockScroll && (moveX > 20 || moveX < -20) && moveY < 20 && moveY > -20)
        this.lockScroll = 'x';
    if (this.options.scrollY && this.options.lockScroll && (moveY > 20 || moveY < -20) && moveX < 20 && moveX > -20)
        this.lockScroll = 'y';

    var newX = this.options.scrollX && this.lockScroll !== 'y' ? this.prevScrollVec.x + moveX : this.x;
    var newY = this.options.scrollY && this.lockScroll !== 'x' ? this.prevScrollVec.y + moveY : this.y;

    this.scrollTo(newX, newY, 0, 'linear');
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.options.snap)
    {
        var closest = null;
        var closestVec = { x: 0, y: 0 };

        for (var i = 0, len = this.childRect.length; i < len; i++)
        {
            var pos = this.calcRelativePos(this.childRect[i].left, this.childRect[i].top);

            // We have to make the pos negative due to how we're translating
            pos.x = -pos.x;
            pos.y = -pos.y;

            var distance = this.clacPointDistance(this, pos);

            if (!i || distance < closest)
            {
                closest = distance;
                closestVec = pos;
            }
        }

        this.scrollTo(closestVec.x, closestVec.y, this.options.snapSpeed, 'cubic-bezier(0.1, 0.57, 0.1, 1)');
    }
    else if (this.options.momentum)
    {
        var pos = this.getTouchCoords(e);
        var dragLength = Date.now() - this.dragStart;
        var animationLength = dragLength * this.options.momentumSpeed;

        var moveX = pos.x - this.scrollStartVec.x;
        var moveY = pos.y - this.scrollStartVec.y;
        var velX = moveX / dragLength;
        var velY = moveY / dragLength;
        var newX = this.prevScrollVec.x + pos.x + (velX * animationLength);
        var newY = this.prevScrollVec.y + pos.y + (velY * animationLength);

        this.scrollTo(newX, newY, animationLength, 'cubic-bezier(0.165, 0.840, 0.440, 1.000)');
    }

    // Keep track of where we just moved to
    this.prevScrollVec.x = this.x;
    this.prevScrollVec.y = this.y;

    this.element.removeEventListener('mousemove', this.dragEvent);
    this.element.removeEventListener('touchmove', this.dragEvent);
    this.dragEvent = null;

    this.scrollEnd(e);
}