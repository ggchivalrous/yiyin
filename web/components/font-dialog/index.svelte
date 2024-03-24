<script>
  import { Message, Dialog, Input, Form, FormItem } from '@ggchivalrous/db-ui';
  import './index.scss';
  import { createEventDispatcher } from 'svelte';

  export let visible = false;

  const dispatch = createEventDispatcher();
  const fontForm = {
    name: '',
    path: '',
    isAutoName: false,
  };

  function close() {
    visible = false;
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
    dispatch('update');
    close();
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

        fontForm.name = formatFontName(arr.join('.'));
      }
    }
  }

  function onNameChange() {
    if (fontForm.name) {
      fontForm.isAutoName = false;
    }
  }

  function onNameInput(v) {
    fontForm.name = formatFontName(v.detail);
  }

  function formatFontName(v) {
    const match = v.match(/([\u4e00-\u9fa5a-zA-Z_]+)/);
    return match ? match[0] : '';
  }
</script>

<Dialog bind:visible width="400px" class="font-dialog">
  <Form>
    <FormItem label="字体名称">
      <Input
        type="text"
        value={fontForm.name}
        placeholder="Enter name..."
        on:change={onNameChange}
        on:input={onNameInput}
      />
    </FormItem>
    <FormItem label="字体文件">
      <input class="font-input-file grass" type="file" on:change={onFileChange} />
    </FormItem>
  </Form>

  <footer class="modal-footer">
    <div class="grass button" on:click={close} on:keypress role="button" tabindex="-1">取消</div>
    <div class="grass button" on:click={onFormSubmit} on:keypress role="button" tabindex="-1">添加</div>
  </footer>
</Dialog>
