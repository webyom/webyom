/**
 * @class YOM.dragdrop.Draggable
 */
define('./draggable', ['../core/core-built'], function(YOM) {
	function Draggable(el, opts) {
		Draggable.superClass.constructor.call(this, {
			dragmousedown: new YOM.Observer(),
			dragstart: new YOM.Observer(),
			dragmove: new YOM.Observer(),
			dragstop: new YOM.Observer()
		})
		this._el = YOM(el)
		this._opts = opts || {}
		this._dragging = false
		this._dragStarted = false
		this._fix = this._opts.fix || 0
		this._pos = {
			start: {left: 0, top: 0},
			now: {left: 0, top: 0}
		}
		this._mouse = {
			start: {x: 0, y: 0},
			now: {x: 0, y: 0}
		}
		this._rect = {start: null, now: null}
		this._bound = {
			mousedown: $bind(this, this._mousedown),
			startCheck: $bind(this, this._startCheck),
			move: $bind(this, this._move),
			stop: $bind(this, this.stop),
			preventSelect: function(e) {YOM.Event.preventDefault(e)}
		}
		this._handles = this._opts.handles ? YOM(this._opts.handles, this._el) : this._el
		this._scrollContainer = this._opts.scrollContainer ? YOM(this._opts.scrollContainer) : null
		this.enable()
	}
	
	YOM.Class.extend(Draggable, YOM.Event)
	
	Draggable.prototype = YOM.object.extend(Draggable.prototype, {
		_mousedown: function(e) {
			if(this._dragging) {
				return
			}
			this._dragging = true
			this._dragStarted = false
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var posLeft = parseInt(this._el.getStyle('left'))
			var posTop = parseInt(this._el.getStyle('top'))
			this._rect.start = this._rect.now = this._el.getRect()
			if(isNaN(posLeft) || isNaN(posTop)) {
				var rect = this._el.getRect(this._el.getOffsetParent())
				this._pos.start = {left: rect.left, top: rect.top}
			} else {
				this._pos.start = {left: posLeft, top: posTop}
			}
			this._mouse.start = {x: mouseX, y: mouseY}
			this._pos.now = YOM.object.clone(this._pos.start)
			this._mouse.now = YOM.object.clone(this._mouse.start)
			YOM.Event.addListener(document, 'mousemove', this._bound.startCheck)
			YOM.Event.addListener(document, 'mouseup', this._bound.stop)
			YOM.Event.addListener(document, YOM.browser.ie ? 'selectstart' : 'mousedown', this._bound.preventSelect)
			this.dispatchEvent(this.createEvent('dragmousedown', {
				el: this._el,
				handles: this._handles,
				pos: this._pos,
				mouse: this._mouse
			}), 1)
		},
		
		_startCheck: function(e) {
			var snap = parseInt(this._opts.snap) || 0
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = Math.abs(mouseX - this._mouse.start.x)
			var moveY = Math.abs(mouseY - this._mouse.start.y)
			this._mouse.now = {x: mouseX, y: mouseY}
			if(moveX > snap || moveY > snap) {
				YOM.Event.removeListener(document, 'mousemove', this._bound.startCheck)
				YOM.Event.addListener(document, 'mousemove', this._bound.move)
				this._dragStarted = true
				this.dispatchEvent(this.createEvent('dragstart', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}), 1)
			}
			return this._dragStarted
		},
		
		_move: function(e) {
			var fix = this._fix
			var boundary = this._opts.boundary
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = mouseX - this._mouse.start.x
			var moveY = mouseY - this._mouse.start.y
			var startRect = this._rect.start
			var toLeft = startRect.left + moveX + fix
			var toTop = startRect.top + moveY + fix
			if(boundary) {
				if(boundary == 'PAGE') {
					boundary = YOM(document.body).getRect()
					var viewRect = YOM.Element.getViewRect()
					boundary.height = Math.max(boundary.height, viewRect.height)
					boundary.width = Math.max(boundary.width, viewRect.width)
					boundary.bottom = Math.max(boundary.bottom, viewRect.bottom)
					boundary.right = Math.max(boundary.right, viewRect.right)
				} else if(boundary == 'VIEW') {
					boundary = YOM.Element.getViewRect()
				} else if(YOM(boundary).get()) {
					boundary = YOM(boundary).getRect()
				} else if(!isNaN(boundary.left) && !isNaN(boundary.top) && !isNaN(boundary.right) && !isNaN(boundary.bottom)) {
					boundary = YOM.object.extend(boundary, {width: boundary.right - boundary.left, height: boundary.bottom - boundary.top})
				} else {
					boundary = null
				}
				if(boundary && boundary.width > 0 && boundary.height > 0) {
					if(boundary.width >= startRect.width) {
						if(startRect.left + moveX + fix < boundary.left) {
							toLeft += boundary.left - startRect.left - moveX - fix
						} else if(startRect.right + moveX + fix > boundary.right) {
							toLeft += boundary.right - startRect.right - moveX - fix
						}
					}
					if(boundary.height >= startRect.height) {
						if(startRect.top + moveY + fix < boundary.top) {
							toTop += boundary.top - startRect.top - moveY - fix
						} else if(startRect.bottom + moveY + fix > boundary.bottom) {
							toTop += boundary.bottom - startRect.bottom - moveY - fix
						}
					}
				}
			}
			var parentRect = this._el.getOffsetParent().getRect()
			toLeft -= parentRect.left
			toTop -= parentRect.top
			this._el.setStyle({
				left: toLeft + 'px',
				top: toTop + 'px'
			})
			this._pos.now = {left: toLeft, top: toTop}
			this._mouse.now = {x: mouseX, y: mouseY}
			this._rect.now = this._el.getRect()
			try {
				this.dispatchEvent(this.createEvent('dragmove', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}))
			} catch(e) {
				this._checkScroll(mouseX, mouseY)
				throw(e)
			}
			this._checkScroll(mouseX, mouseY)
		},
		
		_checkScroll: function(mouseX, mouseY) {
			var scrollContainer = this._scrollContainer
			if(!scrollContainer) {
				return
			}
			var rect = YOM.Element.isBody(scrollContainer.get()) ? YOM.Element.getViewRect() : scrollContainer.getRect()
			var advance = this._opts.scrollAdvance || Math.floor(Math.min(30, rect.width / 10, rect.height / 10))
			var maxStep = this._opts.scrollStep || 3
			if(mouseY + advance > rect.bottom) {
				scrollContainer.scrollTopBy(Math.min(mouseY + advance - rect.bottom, maxStep), 0)
			} else if(mouseY - advance < rect.top) {
				scrollContainer.scrollTopBy(Math.max(mouseY - advance - rect.top, -maxStep), 0)
			}
			if(mouseX + advance > rect.right) {
				scrollContainer.scrollLeftBy(Math.min(mouseX + advance - rect.right, maxStep), 0)
			} else if(mouseX - advance < rect.left) {
				scrollContainer.scrollLeftBy(Math.max(mouseX - advance - rect.left, -maxStep), 0)
			}
		},
		
		enable: function() {
			this._handles.addEventListener('mousedown', this._bound.mousedown)
			return this
		},
		
		disable: function() {
			this._handles.removeEventListener('mousedown', this._bound.mousedown)
			return this
		},
		
		stop: function() {
			YOM.Event.removeListener(document, 'mousemove', this._bound.startCheck)
			YOM.Event.removeListener(document, 'mousemove', this._bound.move)
			YOM.Event.removeListener(document, 'mouseup', this._bound.stop)
			YOM.Event.removeListener(document, YOM.browser.ie ? 'selectstart' : 'mousedown', this._bound.preventSelect)
			this._dragging = false
			if(this._dragStarted && this._el) {
				this.dispatchEvent(this.createEvent('dragstop', {
					el: this._el,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect
				}))
			}
		},
		
		destory: function() {
			this.disable()
			this.stop()
			this._el = null
			this._handles = null
		}
	})
	
	return Draggable
})



/**
 * @class YOM.dragdrop.Droppable
 */
define('./droppable', ['../core/core-built', './draggable'], function(YOM, Draggable) {
	YOM.dragdrop = YOM.dragdrop || {}
	YOM.dragdrop.Draggable = Draggable
	
	function Droppable(el, dropboxes, opts) {
		Droppable.superClass.constructor.call(this, el, opts)
		this.addObservers({
			dropstart: new YOM.Observer(),
			dropenter: new YOM.Observer(),
			dropmove: new YOM.Observer(),
			dropleave: new YOM.Observer(),
			droprelease: new YOM.Observer()
		})
		this._oriEl = this._el
		this._dropboxes = YOM(dropboxes)
		this._clone = this._opts.clone
		this._startOff = typeof this._opts.startOff == 'number' ? {left: this._opts.startOff, top: this._opts.startOff} : this._opts.startOff || {left: 0, top: 0}//the distance of cloned el off the original one while mousedown
		this._lastCalMouse = this._mouse.now//the last mouse position calculating overlap
		this._lastCalTime = $now()//the last time calculating overlap
		this._calSpaceInterval = this._opts.calSpaceInterval || 10
		this._calTimeInterval = this._opts.calTimeInterval || 50
		this._lastDropbox = null
	}
	
	YOM.Class.extend(Droppable, YOM.dragdrop.Draggable)
	
	Droppable.prototype = YOM.object.extend(Droppable.prototype, {
		_clear: function() {
			if(this._clone && this._el && this._el != this._oriEl) {
				this._el.remove()
				this._el = this._oriEl
			}
			this._oriEl.restoreStyle('position')
			this._oriEl.restoreStyle('margin')
		},
		
		_mousedown: function(e) {
			if(this._dragging) {
				return
			}
			Droppable.superClass._mousedown.call(this, e)
			var startRect = this._rect.start
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var offsetX = mouseX - startRect.left
			var offsetY = mouseY - startRect.top
			this._oriEl.storeStyle('position')
			this._oriEl.storeStyle('margin')
			if(this._clone) {
				if(typeof this._clone == 'function') {
					this._el = YOM(this._clone(this._el, startRect))
				} else {
					this._el = this._oriEl.clone(true)
				}
				this._el.appendTo(this._opts.cloneContainer || document.body)
				var cloneRect = this._el.getRect()
				var relativeRect = this._oriEl.getRect(this._el.getOffsetParent())
				this._el.setStyle({
					position: 'absolute',
					margin: '0',
					left: relativeRect.left + (offsetX * (startRect.width - cloneRect.width) / startRect.width) + this._startOff.left + 'px',
					top: relativeRect.top + (offsetY * (startRect.height - cloneRect.height) / startRect.width) + this._startOff.top + 'px'}
				)
				this._rect.start = this._el.getRect()
			}
		},
		
		_startCheck: function(e) {
			if(Droppable.superClass._startCheck.call(this, e)) {
				var mouseX = YOM.Event.getPageX(e)
				var mouseY = YOM.Event.getPageY(e)
				var moveX = mouseX - this._mouse.start.x
				var moveY = mouseY - this._mouse.start.y
				var startRect = this._rect.start
				if(!this._clone) {
					var parentRect = this._el.getOffsetParent().getRect()
					this._el.setStyle({
						position: 'absolute',
						margin: '0',
						left: startRect.left - parentRect.left + 'px',
						top: startRect.top - parentRect.top + 'px'
					})
				}
				this._lastCalMouse = this._mouse.now
				this._lastCalTime = $now()
				this.dispatchEvent(this.createEvent('dropstart', {
					el: this._el,
					oriEl: this._oriEl,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect,
					moveX: moveX,
					moveY: moveY
				}), 1)
			}
		},
		
		_move: function(e) {
			Droppable.superClass._move.call(this, e)
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = mouseX - this._lastCalMouse.x
			var moveY = mouseY - this._lastCalMouse.y
			if(Math.abs(moveX) < this._calSpaceInterval && Math.abs(moveY) < this._calSpaceInterval || $now() - this._lastCalTime < this._calTimeInterval) {
				return
			}
			var box = this.getDroppableBox(mouseX, mouseY, this._opts.enterDirection)
			if(box) {
				if(box == this._lastDropbox) {
					this.dispatchEvent(this.createEvent('dropmove', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: YOM(box),
						moveX: moveX,
						moveY: moveY
					}), 1)
				} else {
					if(this._lastDropbox) {
						this.dispatchEvent(this.createEvent('dropleave', {
							el: this._el,
							oriEl: this._oriEl,
							handles: this._handles,
							pos: this._pos,
							mouse: this._mouse,
							rect: this._rect,
							dropbox: YOM(this._lastDropbox),
							moveX: moveX,
							moveY: moveY
						}), 1)
					}
					this.dispatchEvent(this.createEvent('dropenter', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: YOM(box),
						moveX: moveX,
						moveY: moveY
					}), 1)
				}
				this._lastDropbox = box
			} else if(this._lastDropbox) {
				this.dispatchEvent(this.createEvent('dropleave', {
					el: this._el,
					oriEl: this._oriEl,
					handles: this._handles,
					pos: this._pos,
					mouse: this._mouse,
					rect: this._rect,
					dropbox: YOM(this._lastDropbox),
					moveX: moveX,
					moveY: moveY
				}), 1)
				this._lastDropbox = null
			}
			this._lastCalMouse = this._mouse.now
			this._lastCalTime = $now()
		},
		
		stop: function() {
			try {
				Droppable.superClass.stop.call(this)
			} catch(e) {
				this._clear()
				throw(e)
			}
			if(this._dragStarted && this._el) {
				try {
					this.dispatchEvent(this.createEvent('droprelease', {
						el: this._el,
						oriEl: this._oriEl,
						handles: this._handles,
						pos: this._pos,
						mouse: this._mouse,
						rect: this._rect,
						dropbox: this._lastDropbox && YOM(this._lastDropbox)
					}), 1)
				} catch(e) {
					this._clear()
					throw(e)
				}
			}
			this._clear()
		},
		
		getDroppableBox: function(x, y, d) {
			var boxes = YOM.array.filter(this._dropboxes.getAll(), function(item, i) {
				var rect = YOM(item).getRect()
				if((y > rect.top && y < rect.bottom || d == 'H') && (x > rect.left && x < rect.right || d == 'V')) {
					return true
				}
				return false
			})
			return boxes.length ? boxes[boxes.length - 1] : null
		},
		
		addDropboxes: function(dropboxes, head) {
			if(head) {
				this._dropboxes = YOM(dropboxes).concat(this._dropboxes)
			} else {
				this._dropboxes = this._dropboxes.concat(dropboxes)
			}
			return this
		},
		
		destory: function() {
			Droppable.superClass.destory.call(this)
			this._el = null
			this._oriEl = null
			this._dropboxes = null
		}
	})
	
	return Droppable
})



/**
 * @class YOM.dragdrop.Sortable
 */
define('./sortable', ['../core/core-built', './droppable'], function(YOM, Droppable) {
	YOM.dragdrop = YOM.dragdrop || {}
	YOM.dragdrop.Droppable = Droppable
	
	var _DIRECTION_MAP = {'H': 'H', 'V': 'V'}
	
	function Sortable(els, opts) {
		Sortable.superClass.constructor.call(this, {
			sortstart: new YOM.Observer(),
			sortenter: new YOM.Observer(),
			sortmove: new YOM.Observer(),
			sortrelease: new YOM.Observer()
		})
		this._id = $getUniqueId()
		this._opts = opts || {}
		this._opts.clone = typeof this._opts.clone == 'function' ? this._opts.clone : $bind(this, this._clone)
		this._opts.enterDirection = _DIRECTION_MAP[this._opts.enterDirection]
		this._sortDirection = this._opts.enterDirection || _DIRECTION_MAP[this._opts.sortDirection] || 'V'
		this._droppables = []
		this._bound = {
			start: $bind(this, this._start),
			enter: $bind(this, this._enter),
			move: $bind(this, this._move),
			release: $bind(this, this._release)
		}
		this._placeHolder = this._getHolder()
		this._lastDropbox = null
		this._lastMove = 0
		this._items = []
		this._boxes = []
		this.addItem(els)
		this.addBox(opts.box)
	}
	
	YOM.Class.extend(Sortable, YOM.Event)
	
	Sortable.prototype = $extend(Sortable.prototype, {
		_clone: function(el, startRect) {
			var w = parseInt(el.getStyle('width'))
			var h = parseInt(el.getStyle('height'))
			var padding = {
				left: parseInt(el.getStyle('padding-left')) || 0,
				top: parseInt(el.getStyle('padding-top')) || 0,
				right: parseInt(el.getStyle('padding-right')) || 0,
				bottom: parseInt(el.getStyle('padding-bottom')) || 0
			}
			el = el.clone(true)
			el.setStyle({
				width: ((w || startRect.width) - (YOM.browser.ie && YOM.browser.v < 9 ? padding.left + padding.right : 0)) + 'px',
				height: ((h || startRect.height) - (YOM.browser.ie && YOM.browser.v < 9 ? padding.top + padding.bottom : 0)) + 'px',
				opacity: 0.7
			})
			return el
		},
		
		_isBox: function(el) {
			return el.getDatasetVal('yom-sortable-box') == this._id
		},
		
		_start: function(e) {
			if(this.dispatchEvent(this.createEvent('sortstart', e)) ===  false) {
				return
			}
			e.oriEl.setStyle('visibility', 'hidden')
			e.oriEl.find('[data-yom-sortable-item]').setStyle('visibility', 'hidden')
			this.showHolder(e.oriEl)
		},
		
		_enter: function(e) {
			var isBox = this._isBox(e.dropbox)
			if(isBox && YOM.Element.contains(e.dropbox.get(), e.oriEl.get())) {
				return
			}
			var move = this._sortDirection == 'V' ? e.moveY : e.moveX
			if(!move || e.dropbox.get() == e.oriEl.get()) {
				return
			}
			var dropAfter = move > 0 ? 1 : 0
			this._lastDropbox = e.dropbox.get()
			this._lastMove = move
			if(this.dispatchEvent(this.createEvent('sortenter', $extend(e, {dropAfter: dropAfter}))) ===  false) {
				return
			}
			if(dropAfter) {
				if(isBox) {
					e.oriEl.headTo(e.dropbox)
				} else {
					e.oriEl.after(e.dropbox)
				}
			} else {
				if(isBox) {
					e.oriEl.appendTo(e.dropbox)
				} else {
					e.oriEl.before(e.dropbox)
				}
			}
			this.showHolder(e.oriEl)
		},
		
		_move: function(e) {
			var isBox = this._isBox(e.dropbox)
			if(isBox && YOM.Element.contains(e.dropbox.get(), e.oriEl.get())) {
				return
			}
			var move = this._sortDirection == 'V' ? e.moveY : e.moveX
			if(!move || e.dropbox.get() == e.oriEl.get() || e.dropbox.get() == this._lastDropbox && move / this._lastMove > 0) {
				return
			}
			var mouse = e.mouse.now
			var rect = e.dropbox.getRect()
			var dropAfter
			if(move > 0 && (this._sortDirection == 'V' && mouse.y > rect.top + rect.height / 2 || this._sortDirection == 'H' && mouse.x > rect.left + rect.width / 2)) {
				dropAfter = 1
			} else if(move < 0 && (this._sortDirection == 'V' && mouse.y < rect.top + rect.height / 2 || this._sortDirection == 'H' && mouse.x < rect.left + rect.width / 2)) {
				dropAfter = 0
			} else {
				return
			}
			this._lastMove = move
			if(this.dispatchEvent(this.createEvent('sortmove', $extend(e, {dropAfter: dropAfter}))) ===  false) {
				return
			}
			if(dropAfter) {
				if(isBox) {
					e.oriEl.headTo(e.dropbox)
				} else {
					e.oriEl.after(e.dropbox)
				}
			} else {
				if(isBox) {
					e.oriEl.appendTo(e.dropbox)
				} else {
					e.oriEl.before(e.dropbox)
				}
			}
			this.showHolder(e.oriEl)
		},
		
		_release: function(e) {
			if(this.dispatchEvent(this.createEvent('sortrelease', e)) ===  false) {
				return
			}
			var self = this
			var targetRect = e.oriEl.getRect()
			var parentRect = this._opts.cloneContainer && (e.el.getOffsetParent() || e.oriEl.getOffsetParent() || YOM(document.body)).getRect() || YOM(document.body).getRect()
			e.el.clone(true).appendTo(this._opts.cloneContainer || document.body).tween(300, {
				origin: {
					style: {
						left: e.rect.now.left - parentRect.left + 'px',
						top: e.rect.now.top - parentRect.top + 'px',
						opacity: 0.7
					}
				},
				target: {
					style: {
						left: targetRect.left - parentRect.left + 'px',
						top: targetRect.top - parentRect.top + 'px',
						opacity: 1
					}
				},
				complete: function(el) {
					e.oriEl.setStyle('visibility', 'visible')
					e.oriEl.find('[data-yom-sortable-item]').setStyle('visibility', 'visible')
					self.hideHolder()
					el.remove()
				},
				css: true,
				transition: 'easeOut'
			})
		},
		
		_getHolder: function() {
			var holder = this._placeHolder
			if(holder) {
				return holder
			}
			if(this._opts.holderCreater) {
				holder = YOM(this._opts.holderCreater())
			} else {
				holder = YOM(YOM.Element.create('div', {}, this._opts.holderStyle || {
					display: 'none',
					position: 'absolute',
					border: 'dotted 1px #ccc'
				})).appendTo(document.body)
			}
			this._placeHolder = holder
			return holder
		},
		
		showHolder: function(el) {
			var rect = el.getRect()
			var borderWidth = YOM.browser.isQuirksMode() && YOM.browser.ie ? 0 : parseInt(this._placeHolder.getStyle('border-width')) || 0
			this._placeHolder.setStyle({
				left: rect.left + 'px',
				top: rect.top + 'px',
				width: rect.width - borderWidth * 2 + 'px',
				height: rect.height - borderWidth * 2 + 'px'
			}).show()
		},
		
		hideHolder: function() {
			this._placeHolder && this._placeHolder.hide()
		},
		
		addItem: function(els) {
			if(!els) {
				return this
			}
			var self = this
			var toBeAdded = YOM.array.filter(YOM(els).getAll(), function(el) {
				var notFound = true
				YOM.object.each(this._items, function(_el) {
					return notFound = el != _el
				})
				if(notFound) {
					YOM(el).setDatasetVal('yom-sortable-item', self._id)
				}
				return notFound
			})
			if(!toBeAdded.length) {
				return this
			}
			this._items = this._items.concat(toBeAdded)
			YOM.object.each(this._droppables, function(droppable) {
				droppable.addDropboxes(toBeAdded)
			})
			YOM(toBeAdded).each(function(el) {
				var drop = new YOM.dragdrop.Droppable(el, this._boxes.concat(this._items), this._opts)
				drop.addEventListener('dropstart', this._bound.start)
				drop.addEventListener('dropenter', this._bound.enter)
				drop.addEventListener('dropmove', this._bound.move)
				drop.addEventListener('droprelease', this._bound.release)
				this._droppables.push(drop)
			}, this)
			return this
		},
		
		addBox: function(els) {
			if(!els) {
				return this
			}
			var self = this
			var toBeAdded = YOM.array.filter(YOM(els).getAll(), function(el) {
				var notFound = true
				YOM.object.each(this._boxes, function(_el) {
					return notFound = el != _el
				})
				if(notFound) {
					YOM(el).setDatasetVal('yom-sortable-box', self._id)
				}
				return notFound
			})
			if(!toBeAdded.length) {
				return this
			}
			this._boxes = this._boxes.concat(toBeAdded)
			YOM.object.each(this._droppables, function(droppable) {
				droppable.addDropboxes(toBeAdded, true)
			})
			return this
		},
		
		remove: function(els) {
			YOM(els).each(function(el) {
				YOM.array.remove(this._droppables, function(droppable) {
					if(el == droppable._oriEl.get()) {
						droppable.destory()
						return true
					}
					return false
				})
			})
			return this
		},
		
		destory: function() {
			YOM.object.each(this._droppables, function(droppable) {
				droppable.destory()
			})
			try {
				this._placeHolder.remove()
			} catch(e) {}
			this._placeHolder = null
			this._items = null
			this._boxes = null
			this._lastDropbox = null
		}
	})
	
	return Sortable
})



/**
 * @class YOM.dragdrop.Resizeable
 */
define('./resizeable', ['../core/core-built', './draggable'], function(YOM, Draggable) {
	YOM.dragdrop = YOM.dragdrop || {}
	YOM.dragdrop.Draggable = Draggable
	
	function ResizeHandle(el, opts) {
		ResizeHandle.superClass.constructor.call(this, el, opts)
		this._handleType = this._opts.handleType
	}
	
	YOM.Class.extend(ResizeHandle, YOM.dragdrop.Draggable)
	
	ResizeHandle.prototype = YOM.object.extend(ResizeHandle.prototype, {
		_mousedown: function(e) {
			ResizeHandle.superClass._mousedown.call(this, e)
			YOM.Event.cancelBubble(e)
			YOM.Event.preventDefault(e)
		},
		
		_move: function(e) {
			var mouseX = YOM.Event.getPageX(e)
			var mouseY = YOM.Event.getPageY(e)
			var moveX = mouseX - this._mouse.start.x
			var moveY = mouseY - this._mouse.start.y
			this.dispatchEvent(this.createEvent('dragmove', {
				el: this._el,
				handleType: this._handleType,
				moveX: moveX,
				moveY: moveY
			}))
			this._checkScroll(mouseX, mouseY)
		},
		
		_checkScroll: function(mouseX, mouseY) {
			var scrollContainer = this._scrollContainer
			if(!scrollContainer) {
				return
			}
			var rect = YOM.Element.isBody(scrollContainer.get()) ? YOM.Element.getViewRect() : scrollContainer.getRect()
			var advance = this._opts.scrollAdvance || Math.floor(Math.min(30, rect.width / 10, rect.height / 10))
			var maxStep = this._opts.scrollStep || 3
			if(mouseY + advance > rect.bottom) {
				scrollContainer.scrollTopBy(Math.min(mouseY + advance - rect.bottom, maxStep), 0)
			} else if(mouseY - advance < rect.top) {
				scrollContainer.scrollTopBy(Math.max(mouseY - advance - rect.top, -maxStep), 0)
			}
			if(mouseX + advance > rect.right) {
				scrollContainer.scrollLeftBy(Math.min(mouseX + advance - rect.right, maxStep), 0)
			} else if(mouseX - advance < rect.left) {
				scrollContainer.scrollLeftBy(Math.max(mouseX - advance - rect.left, -maxStep), 0)
			}
		},
		
		destory: function() {
			var el = this._el
			ResizeHandle.superClass.destory.call(this)
			el.remove()
		}
	})
	
	function Resizeable(el, opts) {
		Resizeable.superClass.constructor.call(this, {
			resizemove: new YOM.Observer()
		})
		this._el = YOM(el)
		this._opts = opts || {}
		this._minWidth = this._opts.minWidth || 0
		this._minHeight = this._opts.minHeight || 0
		this._maxWidth = this._opts.maxWidth || 9999
		this._maxHeight = this._opts.maxHeight || 9999
		this._startPos = null
		this._startRect = null
		this.bound = {
			mousedown: $bind(this, this._mousedown),
			move: $bind(this, this._move)	
		}
		this._resizeHandles = []
		this._init()
	}
	
	YOM.Class.extend(Resizeable, YOM.Event)
	
	Resizeable.prototype = YOM.object.extend(Resizeable.prototype, {
		_init: function() {
			var attr = {'data-yom-type': 'resizeHandle'}
			var extra = YOM.browser.isQuirksMode() && YOM.browser.ie ? 2 : 0
			var style = YOM.object.extend({
				border: 'solid 1px #000',
				width: 6 + extra + 'px',
				height: 6 + extra + 'px',
				lineHeight: '6px',
				background: '#fff',
				position: 'absolute',
				display: 'none'
			}, this._opts.style)
			var borders = this._getBorders(true)
			var handleTypes = {
				'LT': {left: -borders.left + 'px', top: -borders.top + 'px', cursor: 'nw-resize'},
				'RT': {right: -borders.right + 'px', top: -borders.top + 'px', left: '', cursor: 'ne-resize'},
				'RB': {right: -borders.right + 'px', bottom: -borders.bottom + 'px', left: '', top: '', cursor: 'se-resize'},
				'LB': {left: -borders.left + 'px', bottom: -borders.bottom + 'px', top: '', cursor: 'sw-resize'},
				'R': {right: -borders.right + 'px', top: '50%', left: '', marginTop: '-4px', cursor: 'e-resize'},
				'L': {left: -borders.left + 'px', top: '50%', marginTop: '-4px', cursor: 'w-resize'},
				'T': {left: '50%', top: -borders.top + 'px', marginLeft: '-4px', marginTop: '0', cursor: 'n-resize'},
				'B': {left: '50%', bottom: -borders.bottom + 'px', top: '', marginLeft: '-4px', cursor: 's-resize'}
			}
			var resizeHandle
			if(this._opts.handles) {
				YOM.object.each(this._opts.handles, function(t) {
					if(handleTypes[t]) {
						resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, handleTypes[t]))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: t})
						resizeHandle.addEventListener('dragmove', this.bound.move)
						resizeHandle.addEventListener('dragmousedown', this.bound.mousedown)
						this._resizeHandles.push(resizeHandle)
					}
				}, this)
			} else {
				if(this._el.getStyle('position') == 'absolute') {
					YOM.object.each(handleTypes, function(s, t) {
						resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, s))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: t})
						resizeHandle.addEventListener('dragmove', this.bound.move)
						resizeHandle.addEventListener('dragmousedown', this.bound.mousedown)
						this._resizeHandles.push(resizeHandle)
					}, this)
				} else {
					resizeHandle = new ResizeHandle(this._el.append(YOM.Element.create('div', attr, YOM.object.extend(style, handleTypes['RB']))).setHtml('&nbsp'), {scrollContainer: this._opts.scrollContainer, handleType: 'RB'})
					resizeHandle.addEventListener('dragmove', this.bound.move)
					resizeHandle.addEventListener('dragmousedown', this.bound.mousedown)
					this._resizeHandles.push(resizeHandle)
				}
			}
		},
		
		_getBorders: function(ignoreQuirkMode) {
			if(YOM.browser.isQuirksMode() && YOM.browser.ie && !ignoreQuirkMode) {
				return {left: 0, top: 0, right: 0, bottom: 0}
			}
			return {
				left: parseInt(this._el.getStyle('border-left-width')) || 0,
				top: parseInt(this._el.getStyle('border-top-width')) || 0,
				right: parseInt(this._el.getStyle('border-right-width')) || 0,
				bottom: parseInt(this._el.getStyle('border-bottom-width')) || 0
			}
		},
		
		_getBoundary: function() {
			var boundary = this._opts.boundary
			if(boundary) {
				if(boundary == 'PAGE') {
					boundary = YOM(document.body).getRect()
				} else if(boundary == 'VIEW') {
					boundary = YOM.Element.getViewRect()
				} else if(YOM(boundary).get()) {
					boundary = YOM(boundary).getRect()
				} else if(!isNaN(parseInt(boundary.left)) && !isNaN(parseInt(boundary.top)) && !isNaN(parseInt(boundary.right)) && !isNaN(parseInt(boundary.bottom))) {
					boundary = YOM.object.extend(boundary, {width: boundary.right - boundary.left, height: boundary.bottom - boundary.top})
				} else {
					boundary = null
				}
			}
			return boundary
		},
		
		_setWidth: function(moveX) {
			var w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.width + moveX))
			var boundary = this._getBoundary()
			if(boundary) {
				var borders = this._getBorders()
				if(this._startRect.left + borders.left + borders.right + w > boundary.right) {
					w = Math.min(this._maxWidth, Math.max(this._minWidth, boundary.right - this._startRect.left - borders.left - borders.right))
				}
			}
			this._el.setStyle('width', w + 'px')
		},
		
		_setHeight: function(moveY) {
			var h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.height + moveY))
			var boundary = this._getBoundary()
			if(boundary) {
				var borders = this._getBorders()
				if(this._startRect.top + borders.top + borders.bottom + h > boundary.bottom) {
					h = Math.min(this._maxHeight, Math.max(this._minHeight, boundary.bottom - this._startRect.top - borders.top - borders.bottom))
				}
			}
			this._el.setStyle('height', h + 'px')
		},
		
		_setLeft: function(moveX) {
			var w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.width - moveX))
			var boundary = this._getBoundary()
			if(boundary) {
				var borders = this._getBorders()
				if(this._startRect.right - borders.left - borders.right - w < boundary.left) {
					w = Math.min(this._maxWidth, Math.max(this._minWidth, this._startRect.right - boundary.left - borders.left - borders.right))
				}
			}
			this._el.setStyle('width', w + 'px')
			if(w != this._minWidth && w!= this._maxWidth && w == this._startRect.width - moveX) {
				this._el.setStyle('left', this._startPos.left + moveX + 'px')
			} else {
				this._el.setStyle('left', this._startPos.left + this._startRect.width - w + 'px')
			}
		},
		
		_setTop: function(moveY) {
			var h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.height - moveY))
			var boundary = this._getBoundary()
			if(boundary) {
				var borders = this._getBorders()
				if(this._startRect.bottom - borders.top - borders.bottom - h < boundary.top) {
					h = Math.min(this._maxHeight, Math.max(this._minHeight, this._startRect.bottom - boundary.top - borders.top - borders.bottom))
				}
			}
			this._el.setStyle('height', h + 'px')
			if(h != this._minHeight && h!= this._maxHeight && h == this._startRect.height - moveY) {
				this._el.setStyle('top', this._startPos.top + moveY + 'px')
			} else {
				this._el.setStyle('top', this._startPos.top + this._startRect.height - h + 'px')
			}
		},
		
		_mousedown: function(e) {
			var borders = this._getBorders()
			this._startRect = this._el.getRect()
			this._startRect.width -= borders.left + borders.right
			this._startRect.height -= borders.top + borders.bottom
			var posLeft = parseInt(this._el.getStyle('left'))
			var posTop = parseInt(this._el.getStyle('top'))
			if(isNaN(posLeft) || isNaN(posTop)) {
				var rect = this._el.getRect(this._el.getOffsetParent())
				this._startPos = {left: rect.left, top: rect.top}
			} else {
				this._startPos = {left: posLeft, top: posTop}
			}
		},
		
		_move: function(e) {
			switch(e.handleType) {
			case 'T':
				this._setTop(e.moveY)
				break
			case 'R':
				this._setWidth(e.moveX)
				break
			case 'B':
				this._setHeight(e.moveY)
				break
			case 'L':
				this._setLeft(e.moveX)
				break
			case 'LT':
				this._setLeft(e.moveX)
				this._setTop(e.moveY)
				break
			case 'RT':
				this._setWidth(e.moveX)
				this._setTop(e.moveY)
				break
			case 'RB':
				this._setWidth(e.moveX)
				this._setHeight(e.moveY)
				break
			case 'LB':
				this._setLeft(e.moveX)
				this._setHeight(e.moveY)
				break
			default:
			}
			this.dispatchEvent(this.createEvent('resizemove', {
				el: this._el
			}))
		},
		
		enable: function() {
			this._el.find('[data-yom-type="resizeHandle"]').show()
		},
		
		disable: function() {
			this._el.find('[data-yom-type="resizeHandle"]').hide()
		},
		
		destory: function() {
			this.disable()
			this._el = null
			YOM.object.each(this._resizeHandles, function(resizeHandle, i) {
				resizeHandle.destory()
				this._resizeHandles[i] = null
			}, this)
			this._resizeHandles = null
		}
	})
	
	return Resizeable
})



/**
 * @namespace YOM.dragdrop
 */
define(['require', 'exports', 'module', './draggable', './droppable', './sortable', './resizeable'], function(require) {
	return {
		'Draggable': require('./draggable'),
		'Droppable': require('./droppable'),
		'Sortable': require('./sortable'),
		'Resizeable': require('./resizeable')
	}
})

