<script lang="ts">
  import './dialog.scss';
  import { arrToObj, cpObj, matchAnyStrFields, matchFields } from '@common/utils';
  import { ActionItem, FontSetting, FieldSelect } from '@components';
  import { Dialog, Input, Switch, Radio } from '@ggchivalrous/db-ui';
  import { config } from '@web/store/config';
  import { md5 } from '@web/util/md5';
    import { tick } from 'svelte';

  import type { ITemp } from '@/common/const/def-temps';

  export let visible = false;
  export let data: ITemp = null;

  let form: ITemp = null;
  let tempInputDom: HTMLInputElement = null;
  let replaceFieldTemp = '';

  $: listenData(data);
  $: tempFieldRecord = arrToObj([...$config.tempFields, ...$config.customTempFields], 'key');
  $: tempFieldRecordByName = arrToObj([...$config.tempFields, ...$config.customTempFields], 'name');
  $: replaceFieldTemp = replaceTempField(form?.temp || '');

  function listenData(d: ITemp) {
    form = Object.assign(form || {}, cpObj(d || {}));
  }

  function replaceTempField(temp: string) {
    const fields = matchFields(temp);
    if (!fields) {
      return temp;
    }

    for (const field in fields) {
      if (tempFieldRecord[field]) {
        const fieldInfo = fields[field];
        temp = temp.replaceAll(fieldInfo.temp, `{${tempFieldRecord[field].name}}`);
      }
    }

    return temp;
  }

  function onInputTemp(e: CustomEvent<string>) {
    form.temp = restoreTempField(e.detail);
  }

  function restoreTempField(temp: string) {
    const fields = matchAnyStrFields(temp);
    if (!fields) {
      return temp;
    }

    for (const field in fields) {
      if (tempFieldRecordByName[field]) {
        const fieldInfo = fields[field];
        temp = temp.replaceAll(fieldInfo.temp, `{${tempFieldRecordByName[field].key}}`);
      }
    }

    return temp;
  }

  function onSave() {
    config.update((v) => {
      if (!form.key) {
        form.key = md5(`${Date.now()}-${form.name}`);
        v.temps.push(cpObj(form));
        return v;
      }

      const temp = v.temps.find((i) => i.key === form.key);

      if (temp) {
        Object.assign(temp, form);
      }

      return v;
    });
    visible = false;
  }

  function onFieldSelect(e: CustomEvent<string>) {
    insertText(e.detail);
  }

  function insertText(text: string) {
    // 获取光标位置
    const startPos = tempInputDom.selectionStart;
    const endPos = tempInputDom.selectionEnd;
    if (startPos === undefined || endPos === undefined) {
      form.temp += text;
      tempInputDom.focus();
      return;
    }

    const textBefore = replaceFieldTemp.substring(0, startPos);
    const textAfter = replaceFieldTemp.substring(endPos);

    form.temp = restoreTempField(textBefore + text + textAfter);
    tick().then(() => {
      tempInputDom.focus();
      tempInputDom.selectionStart = startPos + text.length;
      tempInputDom.selectionEnd = startPos + text.length;
    });
  }
</script>

<Dialog class="custom-param-dialog" title="设置文字模板" bind:visible appendToBody width="520px" top="8vh">
  <ActionItem title="是否显示">
    <Switch bind:value={form.use} />
  </ActionItem>

  <ActionItem title="名称">
    <Input class="text-input" bind:value={form.name} />
  </ActionItem>

  <ActionItem title="模板内容">
    <svelte:fragment slot="popup">
      定义该模板显示内容
      <br>
      注意：内容长度不能过长否则文字会被截断或输出异常
    </svelte:fragment>
    <Input bind:input={tempInputDom} class="text-input" type="text" value={replaceFieldTemp} on:input={onInputTemp}>
      <FieldSelect slot="append" on:change={onFieldSelect} />
    </Input>
  </ActionItem>

  <ActionItem title="图片对齐">
    <svelte:fragment slot="popup">指定图片内容和文字内容的垂直对齐方式，默认时文字基线对齐</svelte:fragment>
    <Radio bind:value={form.verticalAlign} label="baseline">基线对齐</Radio>
    <Radio bind:value={form.verticalAlign} label="center">居中对齐</Radio>
  </ActionItem>

  <div class="form-item">
    <div class="form-item-label title">字体参数</div>
    <div class="form-item-content">
      <FontSetting bind:conf={form.font} showUseSwitch={false} />
    </div>
  </div>

  <footer>
    <div class="button grass" on:click={() => (visible = false)} on:keypress role="button" tabindex="-1">取 消</div>
    <div class="button grass" on:click={onSave} on:keypress role="button" tabindex="-1">保 存</div>
  </footer>
</Dialog>
