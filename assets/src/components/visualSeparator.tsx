import React from "react";

/**
 * {@link VisualSeparator} Component Props
 */
export type VisualSeparatorProps = {
  /**
   * Overrides the default `className` on the returned element.
   */
  className?: string;
};

/**
 * A stylable accent for visually separating content.
 *
 * This component is strictly for visual presentation and is ignored by
 * screen-readers.
 *
 * The default `className` is `c-visual-separator`
 *
 * @param {VisualSeparatorProps} props Component Props
 */
export const VisualSeparator = ({
  className,
}: VisualSeparatorProps): React.ReactElement => (
  <img
    className={className ?? "c-visual-separator"}
    aria-hidden={true}
    alt="" />
);
