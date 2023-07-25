import React, { ReactNode } from "react"
import { useState } from "react"
import { joinClasses } from "../helpers/dom"

import { CollapseIcon, ExpandIcon } from "../helpers/icon"
import { ToggleIcon } from "./toggleIcon"

interface FilterAccordionProps {
  /**
   * The title of the Filter Accordion.
   */
  heading: string
  /**
   * Whether the accordion should be expanded or not.
   */
  showFilters: boolean
  /**
   * Callback invoked when the show-hide button is clicked.
   */
  setShowFilters: (currentValue: boolean) => void
  /**
   * Allows adding a className to the top level element
   */
  className?: string
  /**
   * Elements to show within the expanding section of the accordion
   */
  children: ReactNode
}

/**
 * A accordion that provides a configurable header and filter contents.
 * Specifically implements the designs for Filter Accordions within Skate.
 *
 * ---
 *
 * Split off from `<GarageFilter/>`
 */
export const FilterAccordion = ({
  heading,
  showFilters,
  setShowFilters,
  className,
  children,
}: FilterAccordionProps) => {
  return (
    <div
      className={joinClasses(["c-filter-accordion", className])}
      aria-expanded={showFilters}
    >
      <button
        className="c-filter-accordion__toggle-button"
        onClick={() => setShowFilters(showFilters)}
      >
        <div className="c-filter-accordion__header">{heading}</div>
        <div className="c-filter-accordion__show-hide-icon">
          {showFilters ? <CollapseIcon /> : <ExpandIcon />}
        </div>
      </button>
      <div className="c-filter-accordion__body">
        <ul className="c-filter-accordion__filters">{children}</ul>
      </div>
    </div>
  )
}

export interface FilterAccordionToggleProps {
  /**
   * The name text to display next to the toggle control.
   */
  name: string
  /**
   * On/Off state of the toggle.
   */
  active?: boolean
  /**
   * Callback invoked when toggle is clicked
   */
  onClick?: () => void
}

/**
 * {@link FilterAccordion} Toggle button component.
 */
export const FilterAccordionToggle = ({
  name,
  active = false,
  onClick,
}: FilterAccordionToggleProps) => {
  return (
    <button
      className="c-filter-accordion__filter-toggle"
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{name}</span>
      <ToggleIcon active={active} className="c-filter-accordion__toggle-icon" />
    </button>
  )
}

/**
 * {@link FilterAccordion} Toggle Button list item
 */
export const FilterAccordionToggleFilter = (
  props: FilterAccordionToggleProps
) => {
  return (
    <li className="c-filter-accordion__filter">
      <FilterAccordionToggle {...props} />
    </li>
  )
}

export interface FilterAccordionWithExpansionStateProps
  extends Omit<FilterAccordionProps, "showFilters" | "setShowFilters"> {
  initialActiveState?: boolean
}

/**
 * {@link FilterAccordion} which contains it's own expanded state.
 *
 * ---
 *
 * Useful for prototyping and debugging.
 */
export const FilterAccordionWithExpansionState = ({
  initialActiveState,
  ...props
}: FilterAccordionWithExpansionStateProps) => {
  const [showFilters, setShowFilters] = useState<boolean>(
    initialActiveState || true
  )
  return (
    <FilterAccordion
      {...props}
      showFilters={showFilters}
      setShowFilters={() => setShowFilters(!showFilters)}
    />
  )
}

export interface FilterAccordionFilterWithStateProps
  extends Omit<FilterAccordionToggleProps, "active"> {
  initialActiveState?: boolean
}

/**
 * {@link FilterAccordionToggleFilter} with self contained active state.
 *
 * ---
 *
 * There is not a good way to get the data out of this component, although it's
 * useful for prototyping, you probably want {@link FilterAccordionToggleFilter}
 * to receive events and control the state from another component.
 */
export const FilterAccordionToggleFilterWithState = ({
  initialActiveState = false,
  ...props
}: FilterAccordionFilterWithStateProps) => {
  const [active, setActive] = useState(initialActiveState)
  return (
    <FilterAccordionToggleFilter
      {...props}
      active={active}
      onClick={() => setActive((value) => !value)}
    />
  )
}

/** @see {@link FilterAccordionToggleFilterWithState } */
FilterAccordionToggleFilter.WithState = FilterAccordionToggleFilterWithState

/** @see {@link FilterAccordionToggleFilter } */
FilterAccordion.ToggleFilter = FilterAccordionToggleFilter

/** @see {@link FilterAccordionWithExpansionState } */
FilterAccordion.WithExpansionState = FilterAccordionWithExpansionState
