<script>
  import { onMount, createEventDispatcher, tick } from 'svelte';
  import './index.css';

  let className = '';
  export { className as class };
  export let style = '';
  export let value = false;
  export let disabled = false;
  export let width = 40;
  export let activeIconClass = '';
  export let inactiveIconClass = '';
  export let activeText = '';
  export let inactiveText = '';
  export let activeColor = '';
  export let inactiveColor = '';
  export let activeValue = true;
  export let inactiveValue = false;
  export let name = '';

  // eslint-disable-next-line svelte/valid-compile
  export let validateEvent = true;
  export let id = '';
  export let el = null;

  let coreWidth = width;
  let checked;
  let switchDisabled;
  let input;
  let core;

  let dbFormDisabled;

  const dispatch = createEventDispatcher();

  $: checked = value === activeValue;
  $: switchDisabled = disabled || dbFormDisabled || false;
  $: input && watchChecked(checked);

  if (!~[activeValue, inactiveValue].indexOf(value)) {
    value = inactiveValue;
    dispatch('input', inactiveValue);
  }

  onMount(() => {
    coreWidth = width || 40;
    if (activeColor || inactiveColor) {
      setBackgroundColor();
    }
    input.checked = checked;
  });

  function watchChecked() {
    input.checked = checked;
    if (activeColor || inactiveColor) {
      setBackgroundColor();
    }
  }

  async function handleChange() {
    const val = checked ? inactiveValue : activeValue;
    value = val;
    dispatch('input', val);
    dispatch('change', val);
    await tick();
    input.checked = checked;
  }

  function setBackgroundColor() {
    const newColor = checked ? activeColor : inactiveColor;
    core.style.borderColor = newColor;
    core.style.backgroundColor = newColor;
  }

  function switchValue(e) {
    e.keyCode === 13 && changeValue();
  }

  function changeValue() {
    !switchDisabled && handleChange();
  }

  function focus() {
    input.focus();
  }
</script>

<div
  tabindex={id}
  class="db-switch {className}"
  class:is-disabled={switchDisabled}
  class:is-checked={checked}
  {style}
  role="switch"
  aria-checked={checked}
  aria-disabled={switchDisabled}
  on:click|preventDefault={changeValue}
  on:keypress
  bind:this={el}
>
  <input
    {id}
    {name}
    class="db-switch__input"
    type="checkbox"
    bind:this={input}
    true-value={activeValue}
    false-value={inactiveValue}
    disabled={switchDisabled}
    on:keydown={switchValue}
    on:change={handleChange}
  />
  {#if inactiveIconClass || inactiveText}
    <span
      class="db-switch__label db-switch__label--left {!checked
        ? 'is-active'
        : ''}"
    >
      {#if inactiveIconClass}
        <i class={inactiveIconClass} />
      {/if}
      {#if !inactiveIconClass && inactiveText}
        <span aria-hidden={checked}>{inactiveText}</span>
      {/if}
    </span>
  {/if}
  <span
    class="db-switch__core"
    bind:this={core}
    style="width: {coreWidth}px;"
  />
  {#if activeIconClass || activeText}
    <span
      class="db-switch__label db-switch__label--right {checked
        ? 'is-active'
        : ''}"
    >
      {#if activeIconClass}
        <i class={activeIconClass} />
      {/if}
      {#if !activeIconClass && activeText}
        <span aria-hidden={!checked}>{activeText}</span>
      {/if}
    </span>
  {/if}
</div>
