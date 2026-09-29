import { createApp } from "vue";
import App from "./App.vue";
import { Icon, addCollection } from "@iconify/vue";
import lineMdJson from "@iconify-json/line-md/icons.json";
import "./assets/style.css";

addCollection(lineMdJson);

const app = createApp(App);
app.component("Icon", Icon);
app.mount("#app");
