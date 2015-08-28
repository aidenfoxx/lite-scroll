/** 
 * Lite Scroll
 * 
 * @version    0.1
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
    this.elementRect = this.element.getBoundingClientRect();
    this.contentRect = this.content.getBoundingClientRect();

    this.resizeTimeout = null;

    this.scrollEvent = null;

    this.x = 0;
    this.y = 0;

    this.scrollStartVec = { x: 0, y: 0 };
    this.prevScrollVec = { x: 0, y: 0 };

    this.options = {
        scrollX: false,
        scrollY: true,
        snap: false,
        snapSpeed: '300ms',
        dynamicResize: true
    };

    for (var key in options)
        this.options[key] = options[key];

    this.bindEvents();
}

/**
 * VIRTUAL METHODS
 */
LiteScroll.prototype.scrollStart = function(e) { }
LiteScroll.prototype.scroll = function(e) { }
LiteScroll.prototype.scrollEnd = function(e) { }

/**
 * PUBLIC METHODS
 */
LiteScroll.prototype.calcRelativePos = function(x, y)
{
    return { x: x - this.elementRect.left, 
             y: y - this.elementRect.top };
}

LiteScroll.prototype.clacPointDistance = function(point1, point2)
{
    var distX = point2.x - point1.x;
    var distY = point2.y - point1.y;

    return Math.sqrt((distX * distX) + (distY * distY));
}

LiteScroll.prototype.bindEvents = function()
{
    this.element.addEventListener(('ontouchstart' in window) ? 'touchstart' : 'mousedown', this._scrollStart.bind(this));
    window.addEventListener(('ontouchend' in window) ? 'touchend' : 'mouseup', this._scrollEnd.bind(this));

    if (this.options.dynamicResize)
        window.addEventListener('resize', this.resize.bind(this));
}

LiteScroll.prototype.resize = function()
{
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(function() {
        this.elementRect = this.element.getBoundingClientRect();
        this.contentRect = this.content.getBoundingClientRect();
        // Trigger a scrollend to do any snapping
        this._scrollEnd();
    }.bind(this), 500);
}

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.scrollEvent)
    {
        this.scrollStartVec = this.calcRelativePos(e.clientX, e.clientY);
        this.scrollEvent = this._scroll.bind(this);
        this.element.addEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent);

        // Psuedo methods for end users to override
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    var pos = this.calcRelativePos(e.clientX, e.clientY);
    
    if (this.options.scrollX)
    {
        var contentWidth = this.contentRect.width - this.elementRect.width;
        var moveX = pos.x - this.scrollStartVec.x;
        var newX = this.prevScrollVec.x + moveX;

        if (newX > 0 || newX < -(contentWidth))
            this.x = newX <= 0 ? -(contentWidth) : 0;
        else
            this.x = newX;
    }

    if (this.options.scrollY)
    {
        var contentHeight = this.contentRect.height - this.elementRect.height;
        var moveY = pos.y - this.scrollStartVec.y;
        var newY = this.prevScrollVec.y + moveY;

        if (newY > 0 || newY < -(contentHeight))
            this.y = newY <= 0 ? -(contentHeight) : 0;
        else
            this.y = newY;
    }

    this.content.style.transitionDuration = '0ms';
    this.content.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';

    // Psuedo methods for end users to override
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.options.snap)
    {
        var closest = null;
        var closestVec = { x: 0, y: 0 };

        for (var i = 0, len = this.content.children.length; i < len; i++)
        {
            var childRect = this.content.children[i].getBoundingClientRect();
            var pos = this.calcRelativePos(childRect.left - this.x, childRect.top - this.y);

            // We have to make the pos negative due to how we're translating
            pos.x = -pos.x;
            pos.y = -pos.y;

            var distance = this.clacPointDistance(this, pos);

            if (!i)
            {
                closest = distance;
                closestVec = pos;
            }
            else if (distance < closest)
            {
                closest = distance;
                closestVec = pos;
            }
        } 

        this.x = closestVec.x;
        this.y = closestVec.y;

        this.content.style.transitionDuration = this.options.snapSpeed;
        this.content.style.transitionTimingFunction = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
        this.content.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';
    }

    // Keep track of where we just moved to
    this.prevScrollVec.x = this.x;
    this.prevScrollVec.y = this.y;

    this.element.removeEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent);
    this.scrollEvent = null;

    // Psuedo methods for end users to override
    this.scrollEnd(e);
}