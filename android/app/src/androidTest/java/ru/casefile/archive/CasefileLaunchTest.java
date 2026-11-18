package ru.casefile.archive;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import android.os.SystemClock;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class CasefileLaunchTest {
    private String js(ActivityScenario<MainActivity> activity, String expression) throws Exception {
        LinkedBlockingQueue<String> value = new LinkedBlockingQueue<>();
        activity.onActivity(a -> a.getBridge().getWebView().evaluateJavascript(expression, value::offer));
        return value.poll(5, TimeUnit.SECONDS);
    }

    private void waitFor(ActivityScenario<MainActivity> activity, String condition) throws Exception {
        long until = SystemClock.elapsedRealtime() + 25000;
        while (SystemClock.elapsedRealtime() < until) {
            if ("true".equals(js(activity, "Boolean(" + condition + ")"))) return;
            SystemClock.sleep(200);
        }
        fail("WebView condition timed out: " + condition);
    }

    private void click(ActivityScenario<MainActivity> activity, String action) throws Exception {
        String selector = "document.querySelector('[data-act=\""+action+"\"]')";
        waitFor(activity, selector);
        js(activity, selector + ".click()");
    }

    @Test public void opensPackagedGameAndRestoresEvidenceAfterActivityRestart() throws Exception {
        try (ActivityScenario<MainActivity> a = ActivityScenario.launch(MainActivity.class)) {
            waitFor(a, "document.querySelector('main.home')");
            click(a, "start");
            click(a, "begin");
            click(a, "go:map");
            click(a, "go:place/study");
            click(a, "inspect:letter");
            click(a, "deep:letter");
            click(a, "collect:letter");
            waitFor(a, "document.querySelector('.hot.found')");
            assertEquals("true", js(a, "document.documentElement.scrollWidth<=innerWidth"));
        }
        try (ActivityScenario<MainActivity> a = ActivityScenario.launch(MainActivity.class)) {
            waitFor(a, "document.querySelector('.hero [data-act=\"go:office\"]')");
            click(a, "go:office");
            click(a, "go:docs");
            click(a, "deep:letter");
            waitFor(a, "document.querySelector('dialog[open] .paper')");
            assertEquals("true", js(a, "document.querySelector('dialog').innerText.includes('Семьям команды')"));
            a.onActivity(activity -> activity.getOnBackPressedDispatcher().onBackPressed());
            waitFor(a, "!document.querySelector('dialog[open]')");
        }
    }
}
