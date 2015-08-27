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
    {
        return new LiteScroll(element, options);
    }

    this.element = element;
    this.elementRect = element.getBoundingClientRect();
    this.contentRect = element.children[0].getBoundingClientRect();

    this.scrollEvent = null;

    this.x = 0;
    this.y = 0;

    this.startVec = { x: 0, y: 0 };
    this.prevVec = { x: 0, y: 0 };

    this.options = {
        scrollX: false,
        scrollY: true,
        snap: false,
        snapSpeed: '300ms'
    };

    for (var key in options)
    {
        this.options[key] = options[key];
    }

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
    console.log(point1);
    console.log(point2);

    var distX = point2.x - point1.x;
    var distY = point2.y - point1.y;

    return Math.sqrt((distX * distX) + (distY * distY));
}

LiteScroll.prototype.bindEvents = function()
{
    this.element.addEventListener(('ontouchstart' in window) ? 'touchstart' : 'mousedown', this._scrollStart.bind(this), false);
    window.addEventListener(('ontouchend' in window) ? 'touchend' : 'mouseup', this._scrollEnd.bind(this), false);
}

LiteScroll.prototype._scrollStart = function(e)
{
    e.preventDefault();

    if (!this.scrollEvent)
    {
        this.startVec = this.calcRelativePos(e.clientX, e.clientY);
        this.scrollEvent = this._scroll.bind(this);
        this.element.addEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent, false);

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
        var moveX = pos.x - this.startVec.x;
        var newX = this.prevVec.x + moveX;

        if (newX > 0 || newX < -(contentWidth))
            this.x = newX <= 0 ? -(contentWidth) : 0;
        else
            this.x = newX;
    }

    if (this.options.scrollY)
    {
        var contentHeight = this.contentRect.height - this.elementRect.height;
        var moveY = pos.y - this.startVec.y;
        var newY = this.prevVec.y + moveY;

        if (newY > 0 || newY < -(contentHeight))
            this.y = newY <= 0 ? -(contentHeight) : 0;
        else
            this.y = newY;
    }

    this.element.firstElementChild.style.transition = 'transform 0ms';
    this.element.firstElementChild.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';

    // Psuedo methods for end users to override
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    if (this.options.snap)
    {
        var closest = null;
        var closestVec = { x: 0, y: 0 };

        for (var i = 0, len = this.element.children[0].children.length; i < len; i++)
        {
            var pos = this.calcRelativePos(-(this.element.children[0].children[i].offsetLeft), -(this.element.children[0].children[i].offsetTop));
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

        this.element.firstElementChild.style.transition = 'transform ' + this.options.snapSpeed;
        this.element.firstElementChild.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';
    }

    // Keep track of where we just moved to
    this.prevVec.x = this.x;
    this.prevVec.y = this.y;

    this.element.removeEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent, false);
    this.scrollEvent = null;

    // Psuedo methods for end users to override
    this.scrollEnd(e);
}