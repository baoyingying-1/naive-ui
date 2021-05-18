import {
  h,
  nextTick,
  computed,
  ref,
  toRef,
  watch,
  defineComponent,
  PropType,
  CSSProperties
} from 'vue'
import { useMergedState } from 'vooks'
import { NSelect } from '../../select'
import { InputInst, NInput } from '../../input'
import { NBaseIcon } from '../../_internal'
import {
  FastForwardIcon,
  FastBackwardIcon,
  BackwardIcon,
  ForwardIcon,
  MoreIcon
} from '../../_internal/icons'
import { useConfig, useLocale, useTheme } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { paginationLight, PaginationTheme } from '../styles'
import { pageItems } from './utils'
import type { PageItem } from './utils'
import style from './styles/index.cssr'
import { call, ExtractPublicPropTypes, MaybeArray } from '../../_utils'
import type { Size as InputSize } from '../../input/src/interface'
import type { Size as SelectSize } from '../../select/src/interface'

const paginationProps = {
  ...(useTheme.props as ThemeProps<PaginationTheme>),
  page: Number,
  defaultPage: {
    type: Number,
    default: 1
  },
  itemCount: Number,
  pageCount: Number,
  defaultPageCount: {
    type: Number,
    default: 1
  },
  showSizePicker: {
    type: Boolean,
    default: false
  },
  pageSize: Number as PropType<number>,
  defaultPageSize: Number,
  pageSizes: {
    type: Array as PropType<number[]>,
    default: () => [10]
  },
  showQuickJumper: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  pageSlot: {
    type: Number,
    default: 9
  },
  'onUpdate:page': [Function, Array] as PropType<
  MaybeArray<(page: number) => void>
  >,
  onUpdatePage: [Function, Array] as PropType<
  MaybeArray<(page: number) => void>
  >,
  'onUpdate:pageSize': [Function, Array] as PropType<
  MaybeArray<(pageSize: number) => void>
  >,
  onUpdatePageSize: [Function, Array] as PropType<
  MaybeArray<(pageSize: number) => void>
  >,
  /** @deprecated */
  onPageSizeChange: [Function, Array] as PropType<
  MaybeArray<(pageSize: number) => void>
  >,
  /** @deprecated */
  onChange: [Function, Array] as PropType<MaybeArray<(page: number) => void>>
} as const

export type PaginationProps = ExtractPublicPropTypes<typeof paginationProps>

export default defineComponent({
  name: 'Pagination',
  props: paginationProps,
  setup (props) {
    const { NConfigProvider, mergedClsPrefixRef } = useConfig(props)
    const themeRef = useTheme(
      'Pagination',
      'Pagination',
      style,
      paginationLight,
      props,
      mergedClsPrefixRef
    )
    const { localeRef } = useLocale('Pagination')
    const selfRef = ref<HTMLElement | null>(null)
    const jumperRef = ref<InputInst | null>(null)
    const jumperValueRef = ref('')
    const uncontrolledPageRef = ref(props.defaultPage)
    const uncontrolledPageSizeRef = ref(
      props.defaultPageSize || props.pageSizes[0]
    )
    const mergedPageRef = useMergedState(
      toRef(props, 'page'),
      uncontrolledPageRef
    )
    const mergedPageSizeRef = useMergedState(
      toRef(props, 'pageSize'),
      uncontrolledPageSizeRef
    )
    const showFastForwardRef = ref(false)
    const showFastBackwardRef = ref(false)

    const pageSizeOptionsRef = computed(() => {
      const suffix = localeRef.value.selectionSuffix
      return props.pageSizes.map((size) => ({
        label: `${size} / ${suffix}`,
        value: size
      }))
    })
    const inputSizeRef = computed<InputSize>(() => {
      return (
        NConfigProvider?.mergedComponentPropsRef.value?.Pagination?.inputSize ||
        'small'
      )
    })
    const selectSizeRef = computed<SelectSize>(() => {
      return (
        NConfigProvider?.mergedComponentPropsRef.value?.Pagination
          ?.selectSize || 'small'
      )
    })

    const disableTransitionOneTick = (): void => {
      void nextTick(() => {
        const { value: selfEl } = selfRef
        if (!selfEl) return
        selfEl.classList.add('transition-disabled')
        void selfRef.value?.offsetWidth
        selfEl.classList.remove('transition-disabled')
      })
    }
    watch(mergedPageRef, disableTransitionOneTick)
    function doUpdatePage (page: number): void {
      if (page === mergedPageRef.value) return
      const { 'onUpdate:page': _onUpdatePage, onUpdatePage, onChange } = props
      if (_onUpdatePage) call(_onUpdatePage, page)
      if (onUpdatePage) call(onUpdatePage, page)
      // deprecated
      if (onChange) call(onChange, page)
    }
    function doUpdatePageSize (pageSize: number): void {
      if (pageSize === mergedPageSizeRef.value) return
      const {
        'onUpdate:pageSize': _onUpdatePageSize,
        onUpdatePageSize,
        onPageSizeChange
      } = props
      if (_onUpdatePageSize) call(_onUpdatePageSize, pageSize)
      if (onUpdatePageSize) call(onUpdatePageSize, pageSize)
      // deprecated
      if (onPageSizeChange) call(onPageSizeChange, pageSize)
    }
    function forward (): void {
      if (props.disabled) return
      const page = Math.min(mergedPageRef.value + 1, props.pageCount || 1)
      doUpdatePage(page)
    }
    function backward (): void {
      if (props.disabled) return
      const page = Math.max(mergedPageRef.value - 1, 1)
      doUpdatePage(page)
    }
    function fastForward (): void {
      if (props.disabled) return
      const page = Math.min(
        mergedPageRef.value + (props.pageSlot - 4),
        props.pageCount || 1
      )
      doUpdatePage(page)
    }
    function fastBackward (): void {
      if (props.disabled) return
      const page = Math.max(mergedPageRef.value - (props.pageSlot - 4), 1)
      doUpdatePage(page)
    }
    function handleSizePickerChange (value: number): void {
      doUpdatePageSize(value)
    }
    function handleQuickJumperKeyUp (e: KeyboardEvent): void {
      if (e.code === 'Enter') {
        const page = parseInt(jumperValueRef.value)
        if (
          !Number.isNaN(page) &&
          page >= 1 &&
          page <= (props.pageCount || 1)
        ) {
          doUpdatePage(page)
          jumperValueRef.value = ''
          jumperRef.value?.blur()
        }
      }
    }
    function handlePageItemClick (pageItem: PageItem): void {
      if (props.disabled) return
      switch (pageItem.type) {
        case 'page':
          doUpdatePage(pageItem.label)
          break
        case 'fastBackward':
          fastBackward()
          break
        case 'fastForward':
          fastForward()
          break
      }
    }
    function handlePageItemMouseEnter (pageItem: PageItem): void {
      if (props.disabled) return
      switch (pageItem.type) {
        default:
          return
        case 'fastBackward':
          showFastBackwardRef.value = true
          break
        case 'fastForward':
          showFastForwardRef.value = true
          break
      }
      disableTransitionOneTick()
    }
    function handlePageItemMouseLeave (pageItem: PageItem): void {
      if (props.disabled) return
      switch (pageItem.type) {
        default:
          return
        case 'fastBackward':
          showFastBackwardRef.value = false
          break
        case 'fastForward':
          showFastForwardRef.value = false
          break
      }
      disableTransitionOneTick()
    }
    function handleJumperInput (value: string): void {
      jumperValueRef.value = value
    }
    return {
      mergedClsPrefix: mergedClsPrefixRef,
      locale: localeRef,
      selfRef,
      jumperRef,
      mergedPage: mergedPageRef,
      showFastBackward: showFastBackwardRef,
      showFastForward: showFastForwardRef,
      pageItems: computed(() =>
        pageItems(mergedPageRef.value, props.pageCount || 1, props.pageSlot)
      ),
      jumperValue: jumperValueRef,
      pageSizeOptions: pageSizeOptionsRef,
      inputSize: inputSizeRef,
      selectSize: selectSizeRef,
      mergedTheme: themeRef,
      handleJumperInput,
      handleBackwardClick: backward,
      handleForwardClick: forward,
      handlePageItemClick,
      handleSizePickerChange,
      handleQuickJumperKeyUp,
      handlePageItemMouseEnter,
      handlePageItemMouseLeave,
      cssVars: computed(() => {
        const {
          self: {
            itemSize,
            itemPadding,
            itemMargin,
            inputWidth,
            selectWidth,
            inputMargin,
            selectMargin,
            buttonBorder,
            buttonBorderHover,
            buttonBorderPressed,
            buttonIconColor,
            buttonIconColorHover,
            buttonIconColorPressed,
            buttonIconSize,
            itemTextColor,
            itemTextColorHover,
            itemTextColorPressed,
            itemTextColorActive,
            itemTextColorDisabled,
            itemColor,
            itemColorHover,
            itemColorPressed,
            itemColorActive,
            itemColorActiveHover,
            itemColorDisabled,
            itemBorder,
            itemBorderHover,
            itemBorderPressed,
            itemBorderActive,
            itemBorderDisabled,
            itemBorderRadius,
            itemFontSize,
            jumperFontSize,
            jumperTextColor,
            jumperTextColorDisabled
          },
          common: { cubicBezierEaseInOut }
        } = themeRef.value
        return {
          '--item-font-size': itemFontSize,
          '--select-width': selectWidth,
          '--select-margin': selectMargin,
          '--input-width': inputWidth,
          '--input-margin': inputMargin,
          '--item-size': itemSize,
          '--item-text-color': itemTextColor,
          '--item-text-color-disabled': itemTextColorDisabled,
          '--item-text-color-hover': itemTextColorHover,
          '--item-text-color-active': itemTextColorActive,
          '--item-text-color-pressed': itemTextColorPressed,
          '--item-color': itemColor,
          '--item-color-hover': itemColorHover,
          '--item-color-disabled': itemColorDisabled,
          '--item-color-active': itemColorActive,
          '--item-color-active-hover': itemColorActiveHover,
          '--item-color-pressed': itemColorPressed,
          '--item-border': itemBorder,
          '--item-border-hover': itemBorderHover,
          '--item-border-disabled': itemBorderDisabled,
          '--item-border-active': itemBorderActive,
          '--item-border-pressed': itemBorderPressed,
          '--item-padding': itemPadding,
          '--item-border-radius': itemBorderRadius,
          '--bezier': cubicBezierEaseInOut,
          '--jumper-font-size': jumperFontSize,
          '--jumper-text-color': jumperTextColor,
          '--jumper-text-color-disabled': jumperTextColorDisabled,
          '--item-margin': itemMargin,
          '--button-icon-size': buttonIconSize,
          '--button-icon-color': buttonIconColor,
          '--button-icon-color-hover': buttonIconColorHover,
          '--button-icon-color-pressed': buttonIconColorPressed,
          '--button-border': buttonBorder,
          '--button-border-hover': buttonBorderHover,
          '--button-border-pressed': buttonBorderPressed
        }
      })
    }
  },
  render () {
    // it's ok to expand all prop here since no slots' deps
    const {
      mergedClsPrefix,
      disabled,
      cssVars,
      mergedPage,
      pageCount,
      pageItems,
      showFastBackward,
      showFastForward,
      showSizePicker,
      showQuickJumper,
      mergedTheme,
      locale,
      inputSize,
      selectSize,
      pageSize,
      pageSizeOptions,
      jumperValue,
      handleJumperInput,
      handleSizePickerChange,
      handleBackwardClick,
      handlePageItemClick,
      handlePageItemMouseEnter,
      handlePageItemMouseLeave,
      handleForwardClick,
      handleQuickJumperKeyUp
    } = this
    return (
      <div
        ref="selfRef"
        class={[
          `${mergedClsPrefix}-pagination`,
          disabled && `${mergedClsPrefix}-pagination--disabled`
        ]}
        style={cssVars as CSSProperties}
      >
        <div
          class={[
            `${mergedClsPrefix}-pagination-item ${mergedClsPrefix}-pagination-item--button`,
            (mergedPage <= 1 || mergedPage > (pageCount || 1) || disabled) &&
              `${mergedClsPrefix}-pagination-item--disabled`
          ]}
          onClick={handleBackwardClick}
        >
          <NBaseIcon clsPrefix={mergedClsPrefix}>
            {{ default: () => <BackwardIcon /> }}
          </NBaseIcon>
        </div>
        {pageItems.map((pageItem, index) => {
          return (
            <div
              key={index}
              class={[
                `${mergedClsPrefix}-pagination-item`,
                {
                  [`${mergedClsPrefix}-pagination-item--active`]: pageItem.active,
                  [`${mergedClsPrefix}-pagination-item--disabled`]: disabled
                }
              ]}
              onClick={() => handlePageItemClick(pageItem)}
              onMouseenter={() => handlePageItemMouseEnter(pageItem)}
              onMouseleave={() => handlePageItemMouseLeave(pageItem)}
            >
              {pageItem.type === 'page' ? pageItem.label : null}
              {pageItem.type === 'fastBackward' ? (
                showFastBackward ? (
                  <NBaseIcon clsPrefix={mergedClsPrefix}>
                    {{ default: () => <FastBackwardIcon /> }}
                  </NBaseIcon>
                ) : (
                  <NBaseIcon clsPrefix={mergedClsPrefix}>
                    {{ default: () => <MoreIcon /> }}
                  </NBaseIcon>
                )
              ) : null}
              {pageItem.type === 'fastForward' ? (
                showFastForward ? (
                  <NBaseIcon clsPrefix={mergedClsPrefix}>
                    {{ default: () => <FastForwardIcon /> }}
                  </NBaseIcon>
                ) : (
                  <NBaseIcon clsPrefix={mergedClsPrefix}>
                    {{ default: () => <MoreIcon /> }}
                  </NBaseIcon>
                )
              ) : null}
            </div>
          )
        })}
        <div
          class={[
            `${mergedClsPrefix}-pagination-item ${mergedClsPrefix}-pagination-item--button`,
            {
              [`${mergedClsPrefix}-pagination-item--disabled`]:
                mergedPage < 1 || mergedPage >= (pageCount || 1) || disabled
            }
          ]}
          onClick={handleForwardClick}
        >
          <NBaseIcon clsPrefix={mergedClsPrefix}>
            {{ default: () => <ForwardIcon /> }}
          </NBaseIcon>
        </div>
        {showSizePicker ? (
          <NSelect
            size={selectSize}
            placeholder=""
            options={pageSizeOptions}
            value={pageSize}
            disabled={disabled}
            theme={mergedTheme.peers.Select}
            themeOverrides={mergedTheme.peerOverrides.Select}
            onUpdateValue={handleSizePickerChange as any}
          />
        ) : null}
        {showQuickJumper ? (
          <div class={`${mergedClsPrefix}-pagination-quick-jumper`}>
            {locale.goto}
            <NInput
              ref="jumperRef"
              value={jumperValue}
              onUpdateValue={handleJumperInput}
              size={inputSize}
              placeholder=""
              disabled={disabled}
              theme={mergedTheme.peers.Input}
              themeOverrides={mergedTheme.peerOverrides.Input}
              onKeyup={handleQuickJumperKeyUp}
            />
          </div>
        ) : null}
      </div>
    )
  }
})
