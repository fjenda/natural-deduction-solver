<script lang="ts">
    import { FlatToast, ToastContainer } from "svelte-toasts";
    import { Modals } from "svelte-modals";
    import MainLayout from "../layouts/MainLayout.svelte";
    import StyledButton from "../components/StyledButton/StyledButton.svelte";
    import { switchMode } from "../solver/actions/proofActions";
</script>

<main>
    <ToastContainer placement="top-right" let:data={data}>
        <FlatToast {data} />
    </ToastContainer>

    <Modals />

    <StyledButton
        text="Switch Mode"
        onClick={switchMode}
    />

    <MainLayout>
        <slot />
    </MainLayout>
</main>