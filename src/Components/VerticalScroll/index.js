import React, { forwardRef } from 'react';
import './verticalScroll.css';

/**
 * Reusable VerticalScroll container component.
 * Reproduces the vertical scroll styling used in the OBG page.
 *
 * @param {React.ReactNode} children - The content to scroll
 * @param {string} [maxHeight='550px'] - Maximum height before scrolling occurs
 * @param {string} [height] - Explicit height (if a fixed height is desired instead of max-height)
 * @param {string} [className=''] - Additional CSS classes
 * @param {React.CSSProperties} [style={}] - Additional inline styles
 * @param {string} [thumbColor='#6c757d'] - Custom scrollbar thumb color
 * @param {string} [thumbHoverColor='#495057'] - Custom scrollbar thumb hover color
 * @param {string} [trackColor='#f1f1f1'] - Custom scrollbar track color
 * @param {string} [scrollWidth='10px'] - Width of the scrollbar
 * @param {string} [borderRadius='4px'] - Border radius of track and thumb
 */
const VerticalScroll = forwardRef(({
  children,
  maxHeight = '550px',
  height,
  className = '',
  style = {},
  thumbColor = '#6c757d',
  thumbHoverColor = '#495057',
  trackColor = '#f1f1f1',
  scrollWidth = '10px',
  borderRadius = '4px',
  ...restProps
}, ref) => {
  const customStyles = {
    '--scroll-max-height': height ? 'none' : maxHeight,
    '--scroll-thumb-color': thumbColor,
    '--scroll-thumb-hover-color': thumbHoverColor,
    '--scroll-track-color': trackColor,
    '--scroll-width': scrollWidth,
    '--scroll-border-radius': borderRadius,
    ...(height ? { height } : {}),
    ...style,
  };

  return (
    <div
      ref={ref}
      className={`app-vertical-scroll ${className}`.trim()}
      style={customStyles}
      {...restProps}
    >
      {children}
    </div>
  );
});

VerticalScroll.displayName = 'VerticalScroll';

export default VerticalScroll;
