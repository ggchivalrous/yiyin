<script>
  import { Message } from '@ggchivalrous/db-ui';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const fontForm = {
    name: '',
    path: '',
    isAutoName: false,
  };
  const modalStore = getModalStore();

  function close() {
    modalStore.close();
  }

  async function onFormSubmit() {
    const name = fontForm.name.trim();
    if (!name || !fontForm.path) {
      Message.info('请填写完整');
      return;
    }

    const res = await window.api.addFont(fontForm);

    if (res.code === 0) {
      switch (res.data) {
        case 1:
          Message.error('名称重复');
          return;
        case 2:
          Message.error('字体文件不存在');
          return;
        default:
          Message.success('添加成功');
          break;
      }
    }

    if ($modalStore[0].response) $modalStore[0].response(res);
    modalStore.close();
  }

  function onFileChange(ev) {
    if (ev.target && ev.target.type === 'file') {
      const files = ev.target.files;
      fontForm.path = files[0].path;
      if (!fontForm.name || fontForm.isAutoName) {
        fontForm.isAutoName = true;
        const arr = files[0].name.split('.');

        if (arr.length > 1) {
          arr.pop();
        }

        fontForm.name = arr.join('.');
      }
    }
  }

  function onNameChange() {
    if (fontForm.name) {
      fontForm.isAutoName = false;
    }
  }
</script>

{#if $modalStore[0]}
  <div class="card p-4 space-y-4 grass">
    <form class="modal-form">
      <label class="label">
        <span>字体名称</span>
        <input class="input" type="text" bind:value={fontForm.name} placeholder="Enter name..." on:change={onNameChange} />
      </label>
      <label class="label">
        <span>字体文件</span>
        <input class="input" type="file" on:change={onFileChange} />
      </label>
    </form>

    <footer class="modal-footer">
      <button class="grass button" on:click={close}>取消</button>
      <button class="grass button" on:click={onFormSubmit}>添加</button>
    </footer>
  </div>
{/if}

<style scoped>
  .card {
    background-color: var(--bg-color);
    border-radius: 6px;
  }

  .modal-footer {
    text-align: right;
  }
</style>
