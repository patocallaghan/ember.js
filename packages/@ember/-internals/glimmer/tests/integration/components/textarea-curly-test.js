import { RenderingTestCase, moduleFor, classes, applyMixins, runTask } from 'internal-test-helpers';

import { EMBER_MODERNIZED_BUILT_IN_COMPONENTS } from '@ember/canary-features';
import { action } from '@ember/object';
import { assign } from '@ember/polyfills';
import { set } from '@ember/-internals/metal';

class TextAreaRenderingTest extends RenderingTestCase {
  assertTextArea({ attrs, value } = {}) {
    let mergedAttrs = assign({ class: classes('ember-view ember-text-area') }, attrs);
    this.assertComponentElement(this.firstChild, {
      tagName: 'textarea',
      attrs: mergedAttrs,
    });

    if (value) {
      this.assert.strictEqual(value, this.firstChild.value);
    }
  }

  triggerEvent(type, options = {}) {
    let event = document.createEvent('Events');
    event.initEvent(type, true, true);
    assign(event, options);

    this.firstChild.dispatchEvent(event);
  }
}

class BoundTextAreaAttributes {
  constructor(cases) {
    this.cases = cases;
  }

  generate({ attribute, argument = attribute, first, second }) {
    return {
      [`@test [DEPRECATED] ${argument}`]() {
        let deprecation = new RegExp(
          `Passing the \`@${argument}\` argument to <Textarea> is deprecated\\.`
        );

        expectDeprecation(
          () => this.render(`{{textarea ${argument}=this.value}}`, { value: first }),
          deprecation,
          EMBER_MODERNIZED_BUILT_IN_COMPONENTS
        );
        this.assertTextArea({ attrs: { [attribute]: first } });

        this.assertStableRerender();

        expectDeprecation(
          () => runTask(() => set(this.context, 'value', second)),
          deprecation,
          EMBER_MODERNIZED_BUILT_IN_COMPONENTS
        );
        this.assertTextArea({ attrs: { [attribute]: second } });

        expectDeprecation(
          () => runTask(() => set(this.context, 'value', first)),
          deprecation,
          EMBER_MODERNIZED_BUILT_IN_COMPONENTS
        );
        this.assertTextArea({ attrs: { [attribute]: first } });
      },
    };
  }
}

applyMixins(
  TextAreaRenderingTest,
  new BoundTextAreaAttributes([
    { attribute: 'role', argument: 'ariaRole', first: 'textbox', second: 'search' },
    { attribute: 'placeholder', first: 'Stuff here', second: 'Other stuff' },
    { attribute: 'name', first: 'Stuff here', second: 'Other stuff' },
    { attribute: 'title', first: 'Stuff here', second: 'Other stuff' },
    { attribute: 'maxlength', first: '1', second: '2' },
    { attribute: 'rows', first: '1', second: '2' },
    { attribute: 'cols', first: '1', second: '2' },
    { attribute: 'tabindex', first: '1', second: '2' },
  ])
);

moduleFor(
  'Components test: {{textarea}}',
  class extends TextAreaRenderingTest {
    ['@test Should insert a textarea'](assert) {
      this.render('{{textarea}}');

      assert.equal(this.$('textarea').length, 1);

      this.assertStableRerender();
    }

    ['@test [DEPRECATED] Supports elementId'](assert) {
      expectDeprecation(
        () => this.render('{{textarea elementId="test-textarea"}}'),
        /Passing the `@elementId` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.equal(this.$('textarea').attr('id'), 'test-textarea');
    }

    ['@test [DEPRECATED] Should respect disabled'](assert) {
      expectDeprecation(
        () => this.render('{{textarea disabled=this.disabled}}', { disabled: true }),
        /Passing the `@disabled` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.ok(this.$('textarea').is(':disabled'));
    }

    ['@test [DEPRECATED] Should respect disabled when false'](assert) {
      expectDeprecation(
        () => this.render('{{textarea disabled=this.disabled}}', { disabled: false }),
        /Passing the `@disabled` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.ok(this.$('textarea').is(':not(:disabled)'));
    }

    ['@test [DEPRECATED] Should become disabled when the context changes'](assert) {
      expectDeprecation(
        () => this.render('{{textarea disabled=this.disabled}}'),
        /Passing the `@disabled` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.ok(this.$('textarea').is(':not(:disabled)'));

      this.assertStableRerender();

      expectDeprecation(
        () => runTask(() => set(this.context, 'disabled', true)),
        /Passing the `@disabled` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.ok(this.$('textarea').is(':disabled'));

      expectDeprecation(
        () => runTask(() => set(this.context, 'disabled', false)),
        /Passing the `@disabled` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );
      assert.ok(this.$('textarea').is(':not(:disabled)'));
    }

    ['@test Should bind its contents to the specified value']() {
      this.render('{{textarea value=this.model.val}}', {
        model: { val: 'A beautiful day in Seattle' },
      });
      this.assertTextArea({ value: 'A beautiful day in Seattle' });

      this.assertStableRerender();

      runTask(() => set(this.context, 'model.val', 'Auckland'));
      this.assertTextArea({ value: 'Auckland' });

      runTask(() => set(this.context, 'model', { val: 'A beautiful day in Seattle' }));
      this.assertTextArea({ value: 'A beautiful day in Seattle' });
    }

    ['@test GH#14001 Should correctly handle an empty string bound value']() {
      this.render('{{textarea value=this.message}}', { message: '' });

      this.assert.strictEqual(this.firstChild.value, '');

      this.assertStableRerender();

      runTask(() => set(this.context, 'message', 'hello'));

      this.assert.strictEqual(this.firstChild.value, 'hello');

      runTask(() => set(this.context, 'message', ''));

      this.assert.strictEqual(this.firstChild.value, '');
    }

    ['@test should update the value for `cut` / `input` / `change` events']() {
      this.render('{{textarea value=this.model.val}}', {
        model: { val: 'A beautiful day in Seattle' },
      });
      this.assertTextArea({ value: 'A beautiful day in Seattle' });

      this.assertStableRerender();

      runTask(() => {
        this.firstChild.value = 'Auckland';
        this.triggerEvent('cut');
      });
      this.assertTextArea({ value: 'Auckland' });

      runTask(() => {
        this.firstChild.value = 'Hope';
        this.triggerEvent('paste');
      });
      this.assertTextArea({ value: 'Hope' });

      runTask(() => {
        this.firstChild.value = 'Boston';
        this.triggerEvent('input');
      });
      this.assertTextArea({ value: 'Boston' });

      runTask(() => set(this.context, 'model', { val: 'A beautiful day in Seattle' }));
      this.assertTextArea({ value: 'A beautiful day in Seattle' });
    }

    ['@test triggers a method with `{{textarea key-up=this.didTrigger}}`'](assert) {
      expectDeprecation(
        () => {
          this.render(`{{textarea key-up=this.didTrigger}}`, {
            didTrigger: action(function () {
              assert.ok(true, 'action was triggered');
            }),
          });
        },
        /Passing the `@key-up` argument to <Textarea> is deprecated\./,
        EMBER_MODERNIZED_BUILT_IN_COMPONENTS
      );

      this.triggerEvent('keyup', { key: 'A' });
    }
  }
);
