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
    this.contentRect = element.firstElementChild.getBoundingClientRect();

    this.scrollEvent = null;

    this.x = 0;
    this.y = 0;

    this.startVel = { x: 0, y: 0 };
    this.moveVec = { x: 0, y: 0 };
    this.prevVec = { x: 0, y: 0 };

    this.options = {
        scrollX: false,
        scrollY: true
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
LiteScroll.prototype.calcRelativePos = function(e)
{
    return { x: e.clientX - this.elementRect.left, 
             y: e.clientY - this.elementRect.top };
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
        this.startVec = this.calcRelativePos(e);
        this.scrollEvent = this._scroll.bind(this);
        this.element.addEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent, false);

        // Psuedo methods for end users to override
        this.scrollStart(e);
    }
}

LiteScroll.prototype._scroll = function(e)
{
    var pos = this.calcRelativePos(e);
    
    if (this.options.scrollX)
    {
        var contentWidth = this.contentRect.width - this.elementRect.width;
        var moveX = pos.x - this.startVec.x;
        var newX = this.prevVec.x + moveX;

        if (newX > 0 || newX < -(contentWidth))
        {
            this.x = newX <= 0 ? -(contentWidth) : 0;
            this.moveVec.x = moveX - (newX - this.x);
        }
        else
        {
            this.x = newX;
            this.moveVec.x = moveX;
        }
    }

    if (this.options.scrollY)
    {
        var contentHeight = this.contentRect.height - this.elementRect.height;
        var moveY = pos.y - this.startVec.y;
        var newY = this.prevVec.y + moveY;

        if (newY > 0 || newY < -(contentHeight))
        {
            this.y = newY <= 0 ? -(contentHeight) : 0;
            this.moveVec.y = moveY - (newY - this.y);
        }
        else
        {
            this.y = newY;
            this.moveVec.y = moveY;
        }
    }

    this.element.firstElementChild.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px) translateZ(0px)';

    // Psuedo methods for end users to override
    this.scroll(e);
}

LiteScroll.prototype._scrollEnd = function(e)
{
    this.prevVec.x += this.moveVec.x;
    this.prevVec.y += this.moveVec.y;

    this.element.removeEventListener(('ontouchmove' in window) ? 'touchmove' : 'mousemove', this.scrollEvent, false);
    this.scrollEvent = null;

    // Psuedo methods for end users to override
    this.scrollEnd(e);
}