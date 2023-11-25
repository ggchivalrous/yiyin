<script context="module">
  let index = 1;
</script>

<script>
  // eslint-disable-next-line import/first
  import { popup } from '@skeletonlabs/skeleton';

  const popupHover = {
    event: 'hover',
    target: `popupHover${index++}`,
    placement: 'top',
  };
</script>

<span class="icon" use:popup={popupHover}>?</span>

<div class="popup grass" data-popup={popupHover.target}>
	<slot></slot>
  <div class="arrow variant-filled-secondary" />
</div>

<style scoped>
.icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-color: rgba(128, 128, 128, .2);
  color: #fff;
  border-radius: 50%;
  text-align: center;
  line-height: 16px;
  font-size: 12px;
  cursor: pointer;
  margin: 0 2px;
}

.popup {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  background: var(--bg-color);
  padding: 10px 20px;
  border-radius: 4px;
}

.arrow {
  position: absolute;
  height: 0.5rem;
  width: 0.5rem;
  background-color: var(--bg-color);
  transform: rotate(45deg);
}
</style>