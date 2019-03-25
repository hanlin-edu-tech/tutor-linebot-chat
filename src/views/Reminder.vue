<template>
  <section id="reminder">
    <mu-badge content="12" circle color="secondary"
              class="reminder-location" badge-class="demo-icon-badge">
      <mu-button icon>
        <mu-icon size="21" value="notifications"></mu-icon>
      </mu-button>
    </mu-badge>
  </section>
</template>

<script>
  export default {
    name: 'Reminder'
  }
</script>

<style lang="less">
  #reminder {
    .reminder-location {
      position: relative;
      top: -10px;
      left: -20px;
    }

    .demo-icon-badge {
      width: 20px;
      height: 20px;
      margin-top: 25px;
      margin-right: 7px;
    }
  }
</style>