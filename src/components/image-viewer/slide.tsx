import React, { FC } from 'react'
import { useGesture } from '@use-gesture/react'
import { useSpring, animated } from '@react-spring/web'

const classPrefix = `adm-image-viewer`

type Props = {
  image: string
  maxZoom: number
  onTap: () => void
  onZoomChange?: (zoom: number) => void
}

export const Slide: FC<Props> = props => {
  const [{ zoom, x, y }, api] = useSpring(() => ({
    zoom: 1,
    x: 0,
    y: 0,
    config: { tension: 300 },
  }))

  const bind = useGesture(
    {
      onDrag: state => {
        if (state.tap && state.elapsedTime > 0) {
          // 判断点击时间>0是为了过滤掉非正常操作，例如用户长按选择图片之后的取消操作（也是一次点击）
          props.onTap()
          return
        }
        const currentZoom = zoom.get()
        if (currentZoom <= 1) {
          api.start({
            x: 0,
            y: 0,
          })
        } else {
          const [x, y] = state.offset
          api.start({
            x,
            y,
            immediate: true,
          })
        }
      },
      onPinch: state => {
        const [d] = state.offset
        // pinch的rubberband不会自动弹回bound，这里手动实现了
        const zoom = state.last ? Math.max(Math.min(d, props.maxZoom), 1) : d
        api.start({
          zoom,
          immediate: !state.last,
        })
        props.onZoomChange?.(zoom)
        if (state.last && zoom <= 1) {
          api.start({
            x: 0,
            y: 0,
          })
        }
      },
    },
    {
      drag: {
        // filterTaps: true,
        from: () => [x.get(), y.get()],
      },
      pinch: {
        distanceBounds: {
          min: 1,
          max: props.maxZoom,
        },
        rubberband: true,
        from: () => [zoom.get(), 0],
      },
    }
  )

  return (
    <div
      className={`${classPrefix}-slide`}
      onPointerMove={e => {
        if (zoom.get() !== 1) {
          e.stopPropagation()
        }
      }}
    >
      <div className={`${classPrefix}-control`} {...bind()}>
        <animated.div
          className={`${classPrefix}-image-wrapper`}
          style={{ scale: zoom, x, y }}
        >
          <img src={props.image} draggable={false} />
        </animated.div>
      </div>
    </div>
  )
}
