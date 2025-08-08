<script lang="ts">
 export let text: string = "Click Me";
 export let onClick: () => void;
 export let disabled: boolean = false;
 export let style: string = "";
 export let hoverBorderColor: string = "#00ff00";
</script>

<button
    class="btn"
    style={`--hover-color: ${hoverBorderColor}; ${style}`}
    on:click={onClick}
    disabled={disabled}
>
    {text}
</button>

<style lang="scss">
    .btn {
        width: 100%;
        height: 3.5rem;

      &:focus[disabled],
      &:hover[disabled] {
        cursor: not-allowed;
        color: #ffffff4d;
        border: 1px solid var(--dark-border-color);
      }

      &:focus,
      &:hover {
        color: var(--hover-color);
        border: 1px solid var(--hover-color);
        outline: none;
      }
    }

    @media screen and (max-width: 950px) {
      .btn {
        font-size: 0.9rem;
        height: auto;
      }
    }
    
    @media (prefers-color-scheme: light) {
      .btn {
        &:hover {
          color: #00c800;
          border: 1px solid #00c800;
        }

        &:focus[disabled],
        &:hover[disabled] {
          color: #1010104C;
          border: 1px solid var(--light-border-color);
        }
      }
    }
</style>