import deepExtend from '@form-create/utils/lib/deepextend';
import is from '@form-create/utils/lib/type';
import mergeProps from '@form-create/utils/lib/mergeprops';
import {arrayAttrs, normalAttrs} from './attrs';
import {err, logError} from '@form-create/utils/lib/console';

const PREFIX = '[[FORM-CREATE-PREFIX-';
const SUFFIX = '-FORM-CREATE-SUFFIX]]';

export function toJson(obj) {
    return JSON.stringify(deepExtend([], obj, true), function (key, val) {
        if (val && val._isVue === true)
            return undefined;

        if (typeof val !== 'function') {
            return val;
        }
        if (val.__inject)
            val = val.__origin;

        if (val.__emit)
            return undefined;

        return PREFIX + val + SUFFIX;
    });
}

function makeFn(fn) {
    return eval('(function(){return ' + fn + ' })()')
}

export function parseJson(json, mode) {
    return JSON.parse(json, function (k, v) {
        if (is.Undef(v) || !v.indexOf) return v;
        try {
            if (v.indexOf(SUFFIX) > 0 && v.indexOf(PREFIX) === 0) {
                v = v.replace(SUFFIX, '').replace(PREFIX, '');
                return makeFn(v.indexOf('function') === -1 && v.indexOf('(') !== 0 ? 'function ' + v : v);
            } else if (!mode && v.indexOf('function') > -1)
                return makeFn(v)
        } catch (e) {
            err(`解析失败:${v}`);
            return undefined;
        }
        return v;
    });
}

export function enumerable(value, writable) {
    return {
        value,
        enumerable: false,
        configurable: false,
        writable: !!writable
    }
}

//todo 优化位置
export function copyRule(rule, mode) {
    return copyRules([rule], mode || false)[0];
}

export function copyRules(rules, mode) {
    return deepExtend([], [...rules], mode || false);
}

export function mergeRule(rule, merge) {
    mergeProps(Array.isArray(merge) ? merge : [merge], rule, {array: arrayAttrs, normal: normalAttrs});
    return rule;
}

export function getRule(rule) {
    return is.Function(rule.getRule) ? rule.getRule() : rule;
}

export function mergeGlobal(target, merge) {
    if (!target) return merge;
    Object.keys(merge || {}).forEach((k) => {
        mergeRule(target[k], merge[k] || {})
    });
}

export function funcProxy(that, proxy) {
    Object.defineProperties(that, Object.keys(proxy).reduce((initial, k) => {
        initial[k] = {
            get() {
                return proxy[k]();
            }
        }
        return initial;
    }, {}))
}

export function byCtx(rule) {
    return rule.__fc__ || (rule.__origin__ ? rule.__origin__.__fc__ : null)
}

export function invoke(fn, def) {
    try {
        def = fn()
    } catch (e) {
        logError(e);
    }
    return def;
}
